import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((origin) =>
    origin.trim().replace(/\/+$/, "")
  )
  .filter(Boolean);

const productCatalog = {
  1: {
    name: "Kuanta Firfir - Red Spicy",
    category: "meat",
    price: 30,
  },

  2: {
    name: "Bula Firfir",
    category: "veggie",
    price: 20,
  },

  3: {
    name: "Churros With Chocolate Sauce",
    category: "dessert",
    price: 5.49,
  },

  4: {
    name: "Signature Cocktail",
    category: "drink",
    price: 8,
  },

  5: {
    name: "Teff Pancakes",
    category: "breakfast",
    price: 12.99,
  },

  6: {
    name: "Fruit Parfait",
    category: "dessert",
    price: 5.99,
  },

  7: {
    name: "Herbal Iced Tea",
    category: "drink",
    price: 3.5,
  },

  8: {
    name: "Red Chili",
    category: "sauce",

    sizes: {
      "6oz": {
        oz: 6,
        ml: 177,
        price: 8.99,
      },

      "8oz": {
        oz: 8,
        ml: 237,
        price: 11.99,
      },
    },
  },

  9: {
    name: "Enchiladas with Sauce",
    category: "veggie",
    price: 10.99,
  },

  10: {
    name: "Freshly Squeezed Juice",
    category: "drink",
    price: 4.5,
  },

  11: {
    name: "Kuanta Firfir - Alicha",
    category: "meat",
    price: 30,
  },

  12: {
    name: "Green Chili",
    category: "sauce",

    sizes: {
      "6oz": {
        oz: 6,
        ml: 177,
        price: 8.99,
      },

      "8oz": {
        oz: 8,
        ml: 237,
        price: 11.99,
      },
    },
  },

  13: {
    name: "Mustard-Wasabi",
    category: "sauce",

    sizes: {
      "6oz": {
        oz: 6,
        ml: 177,
        price: 9.49,
      },

      "8oz": {
        oz: 8,
        ml: 237,
        price: 12.49,
      },
    },
  },

  14: {
    name: "Teff Chechebsa",
    category: "meat",
    price: 7.99,
  },

  15: {
    name: "Cauliflower Tacos",
    category: "breakfast",
    price: 10.49,
  },

  16: {
    name: "Red Mayo Sweet - Lala",
    category: "sauce",

    sizes: {
      "7oz": {
        oz: 7,
        ml: 207,
        price: 10.99,
      },
    },
  },

  17: {
    name: "Traditional Flan",
    category: "dessert",
    price: 5.99,
  },

  18: {
    name: "Quinoa Veggie Bowl",
    category: "veggie",
    price: 11.99,
  },

  19: {
    name: "Chocolate Lava Cake",
    category: "dessert",
    price: 6.99,
  },

  20: {
    name: "Asian Noodle Salad",
    category: "veggie",
    price: 9.49,
  },

  21: {
    name: "Green Mayo Sweet - Ebby",
    category: "sauce",

    sizes: {
      "7oz": {
        oz: 7,
        ml: 207,
        price: 10.99,
      },
    },
  },

  22: {
    name: "Zoodles with Pesto",
    category: "veggie",
    price: 9.99,
  },

  23: {
    name: "Mustard Mayo Sweet - Jappy",
    category: "sauce",

    sizes: {
      "7oz": {
        oz: 7,
        ml: 207,
        price: 11.49,
      },
    },
  },
};

/* Middleware */

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin =
        origin.replace(/\/+$/, "");

      if (
        allowedOrigins.includes(
          normalizedOrigin
        )
      ) {
        return callback(null, true);
      }

      console.warn(
        `Blocked CORS request from: ${normalizedOrigin}`
      );

      return callback(
        new Error(
          "This website is not allowed to use the API."
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
    ],

    optionsSuccessStatus: 204,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

/* Gmail connection */

const transporter =
  nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,
      pass:
        process.env
          .EMAIL_APP_PASSWORD,
    },
  });

/* Helper functions */

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const cleanText = (value) =>
  String(value || "").trim();

const formatMoney = (value) =>
  Number(value || 0).toFixed(2);

const createMultilineHtml = (
  value
) =>
  escapeHtml(value).replace(
    /\n/g,
    "<br />"
  );

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    cleanText(email)
  );

const createOrderNumber = () => {
  const timePart = Date.now()
    .toString()
    .slice(-7);

  const randomPart = Math.floor(
    100 + Math.random() * 900
  );

  return `AHA-${timePart}-${randomPart}`;
};

const verifySubmittedItems = (
  items
) => {
  const verifiedItems = [];

  for (
    const submittedItem of items
  ) {
    const product =
      productCatalog[
      String(
        submittedItem.itemId
      )
      ];

    if (!product) {
      return {
        error:
          "One of the submitted products could not be found.",
      };
    }

    const quantity = Number(
      submittedItem.quantity
    );

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    ) {
      return {
        error: `Invalid quantity for ${product.name}.`,
      };
    }

    if (
      product.category ===
      "sauce"
    ) {
      const sizeId = cleanText(
        submittedItem.sizeId
      );

      const selectedSize =
        product.sizes[sizeId];

      if (!selectedSize) {
        return {
          error: `Invalid sauce size selected for ${product.name}.`,
        };
      }

      verifiedItems.push({
        itemId:
          submittedItem.itemId,

        name: product.name,

        category:
          product.category,

        quantity,

        sizeId,

        sizeLabel:
          `${selectedSize.oz} oz / ${selectedSize.ml} mL`,

        unitPrice:
          selectedSize.price,

        itemTotal:
          selectedSize.price *
          quantity,
      });
    } else {
      verifiedItems.push({
        itemId:
          submittedItem.itemId,

        name: product.name,

        category:
          product.category,

        quantity,

        sizeId: null,

        sizeLabel: "",

        unitPrice:
          product.price,

        itemTotal:
          product.price *
          quantity,
      });
    }
  }

  return {
    verifiedItems,
  };
};

const createOwnerOrderRows = (
  items
) =>
  items
    .map(
      (item) => `
        <tr>
          <td
            style="
              padding: 12px;
              border-bottom: 1px solid #dddddd;
            "
          >
            <strong>
              ${escapeHtml(
        item.name
      )}
            </strong>

            ${item.sizeLabel
          ? `
                    <div
                      style="
                        margin-top: 4px;
                        color: #777777;
                        font-size: 13px;
                      "
                    >
                      ${escapeHtml(
            item.sizeLabel
          )}
                    </div>
                  `
          : ""
        }
          </td>

          <td
            style="
              padding: 12px;
              text-align: center;
              border-bottom: 1px solid #dddddd;
            "
          >
            ${item.quantity}
          </td>

          <td
            style="
              padding: 12px;
              text-align: right;
              border-bottom: 1px solid #dddddd;
            "
          >
            $${formatMoney(
          item.unitPrice
        )}
          </td>

          <td
            style="
              padding: 12px;
              text-align: right;
              border-bottom: 1px solid #dddddd;
            "
          >
            $${formatMoney(
          item.itemTotal
        )}
          </td>
        </tr>
      `
    )
    .join("");

const createCustomerOrderRows = (
  items
) =>
  items
    .map(
      (item) => `
        <tr>
          <td
            style="
              padding: 12px;
              border-bottom: 1px solid #dddddd;
            "
          >
            <strong>
              ${escapeHtml(
        item.name
      )}
            </strong>

            ${item.sizeLabel
          ? `
                    <div
                      style="
                        margin-top: 4px;
                        color: #777777;
                        font-size: 13px;
                      "
                    >
                      ${escapeHtml(
            item.sizeLabel
          )}
                    </div>
                  `
          : ""
        }
          </td>

          <td
            style="
              padding: 12px;
              text-align: center;
              border-bottom: 1px solid #dddddd;
            "
          >
            ${item.quantity}
          </td>

          <td
            style="
              padding: 12px;
              text-align: right;
              border-bottom: 1px solid #dddddd;
            "
          >
            $${formatMoney(
          item.itemTotal
        )}
          </td>
        </tr>
      `
    )
    .join("");

/* Test route */

app.get(
  "/",
  (request, response) => {
    response.send(
      "Aha'Adu backend is working!"
    );
  }
);

/* Contact form route */

app.post(
  "/api/contact",
  async (
    request,
    response
  ) => {
    try {
      const name = cleanText(
        request.body.name
      );

      const email = cleanText(
        request.body.email
      );

      const message = cleanText(
        request.body.message
      );

      if (
        !name ||
        !email ||
        !message
      ) {
        return response
          .status(400)
          .json({
            success: false,

            message:
              "Please complete all fields.",
          });
      }

      if (
        !isValidEmail(email)
      ) {
        return response
          .status(400)
          .json({
            success: false,

            message:
              "Please enter a valid email address.",
          });
      }

      await transporter.sendMail({
        from:
          `"Aha'Adu Website" <${process.env.EMAIL_USER}>`,

        to:
          process.env
            .OWNER_EMAIL,

        replyTo: email,

        subject:
          `New website message from ${name}`,

        text: `
New contact form message

Name: ${name}
Email: ${email}

Message:
${message}
        `,

        html: `
          <div
            style="
              max-width: 700px;
              margin: auto;
              padding: 25px;
              color: #222222;
              font-family: Arial, sans-serif;
            "
          >
            <h2>
              New website contact message
            </h2>

            <p>
              <strong>Name:</strong>
              ${escapeHtml(name)}
            </p>

            <p>
              <strong>Email:</strong>
              ${escapeHtml(email)}
            </p>

            <p>
              <strong>Message:</strong>
            </p>

            <div
              style="
                padding: 15px;
                background-color: #f3f3f3;
                border-radius: 8px;
                line-height: 1.6;
              "
            >
              ${createMultilineHtml(
          message
        )}
            </div>
          </div>
        `,
      });

      return response
        .status(200)
        .json({
          success: true,

          message:
            "Your message was sent successfully.",
        });
    } catch (error) {
      console.error(
        "Contact email error:",
        error
      );

      return response
        .status(500)
        .json({
          success: false,

          message:
            "The message could not be sent.",
        });
    }
  }
);

/* Order route */

app.post(
  "/api/orders",
  async (
    request,
    response
  ) => {
    try {
      const {
        customer,
        items,
        preferredDate,
        preferredTime,
        specialInstructions,
      } = request.body;

      const fullName =
        cleanText(
          customer?.fullName
        );

      const phone =
        cleanText(
          customer?.phone
        );

      const email =
        cleanText(
          customer?.email
        );

      const orderMethod =
        customer?.orderMethod ===
          "pickup"
          ? "pickup"
          : "delivery";

      if (
        !fullName ||
        !phone ||
        !email
      ) {
        return response
          .status(400)
          .json({
            success: false,

            message:
              "Name, phone number, and email are required.",
          });
      }

      if (
        !isValidEmail(email)
      ) {
        return response
          .status(400)
          .json({
            success: false,

            message:
              "Please enter a valid email address.",
          });
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return response
          .status(400)
          .json({
            success: false,

            message:
              "Your order must contain at least one item.",
          });
      }

      const address =
        cleanText(
          customer?.address
        );

      const unit =
        cleanText(
          customer?.unit
        );

      const city =
        cleanText(
          customer?.city
        );

      const province =
        cleanText(
          customer?.province
        );

      const postalCode =
        cleanText(
          customer?.postalCode
        );

      if (
        orderMethod ===
        "delivery" &&
        (
          !address ||
          !city ||
          !province ||
          !postalCode
        )
      ) {
        return response
          .status(400)
          .json({
            success: false,

            message:
              "Please complete the delivery address.",
          });
      }

      const itemCheck =
        verifySubmittedItems(
          items
        );

      if (itemCheck.error) {
        return response
          .status(400)
          .json({
            success: false,

            message:
              itemCheck.error,
          });
      }

      const verifiedItems =
        itemCheck.verifiedItems;

      const calculatedTotal =
        verifiedItems.reduce(
          (
            total,
            item
          ) =>
            total +
            item.itemTotal,
          0
        );

      const totalItemCount =
        verifiedItems.reduce(
          (
            total,
            item
          ) =>
            total +
            item.quantity,
          0
        );

      const orderNumber =
        createOrderNumber();

      const cleanedPreferredDate =
        cleanText(
          preferredDate
        );

      const cleanedPreferredTime =
        cleanText(
          preferredTime
        );

      const cleanedInstructions =
        cleanText(
          specialInstructions
        );

      const displayOrderMethod =
        orderMethod ===
          "pickup"
          ? "Pickup"
          : "Delivery";

      const ownerAddressHtml =
        orderMethod ===
          "delivery"
          ? `
              <p>
                ${escapeHtml(
            address
          )}

                ${unit
            ? `, Unit ${escapeHtml(
              unit
            )}`
            : ""
          }

                <br />

                ${escapeHtml(
            city
          )},
                ${escapeHtml(
            province
          )}

                <br />

                ${escapeHtml(
            postalCode
          )}
              </p>
            `
          : `
              <p>
                The customer selected pickup.
              </p>
            `;

      const ownerAddressText =
        orderMethod ===
          "delivery"
          ? `${address}${unit
            ? `, Unit ${unit}`
            : ""
          }, ${city}, ${province}, ${postalCode}`
          : "Customer selected pickup.";

      const orderTableRows =
        createOwnerOrderRows(
          verifiedItems
        );

      const customerTableRows =
        createCustomerOrderRows(
          verifiedItems
        );

      const textOrderItems =
        verifiedItems
          .map((item) => {
            const sizeText =
              item.sizeLabel
                ? ` — ${item.sizeLabel}`
                : "";

            return `${item.quantity} × ${item.name}${sizeText} — $${formatMoney(
              item.itemTotal
            )}`;
          })
          .join("\n");

      const ownerEmailHtml = `
        <div
          style="
            max-width: 760px;
            margin: auto;
            padding: 25px;
            color: #222222;
            font-family: Arial, sans-serif;
          "
        >
          <h1
            style="
              color: #e85d5d;
            "
          >
            New Website Order
          </h1>

          <p>
            A new order request was submitted
            through the Aha'Adu website.
          </p>

          <h2>
            Order information
          </h2>

          <p>
            <strong>
              Order number:
            </strong>

            ${orderNumber}

            <br />

            <strong>
              Order method:
            </strong>

            ${displayOrderMethod}

            <br />

            <strong>
              Total items:
            </strong>

            ${totalItemCount}
          </p>

          <h2>
            Customer information
          </h2>

          <p>
            <strong>
              Name:
            </strong>

            ${escapeHtml(
        fullName
      )}

            <br />

            <strong>
              Phone:
            </strong>

            ${escapeHtml(
        phone
      )}

            <br />

            <strong>
              Email:
            </strong>

            ${escapeHtml(
        email
      )}
          </p>

          <h2>
            ${orderMethod ===
          "delivery"
          ? "Delivery address"
          : "Pickup"
        }
          </h2>

          ${ownerAddressHtml}

          <h2>
            Order items
          </h2>

          <table
            style="
              width: 100%;
              border-collapse: collapse;
            "
          >
            <thead>
              <tr
                style="
                  background-color: #f3f3f3;
                "
              >
                <th
                  style="
                    padding: 12px;
                    text-align: left;
                  "
                >
                  Item
                </th>

                <th
                  style="
                    padding: 12px;
                    text-align: center;
                  "
                >
                  Quantity
                </th>

                <th
                  style="
                    padding: 12px;
                    text-align: right;
                  "
                >
                  Price
                </th>

                <th
                  style="
                    padding: 12px;
                    text-align: right;
                  "
                >
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              ${orderTableRows}
            </tbody>
          </table>

          <div
            style="
              margin-top: 25px;
              text-align: right;
            "
          >
            <h2>
              Total:
              $${formatMoney(
          calculatedTotal
        )}
            </h2>
          </div>

          <h2>
            Preferred date and time
          </h2>

          <p>
            <strong>
              Date:
            </strong>

            ${escapeHtml(
          cleanedPreferredDate ||
          "Not provided"
        )}

            <br />

            <strong>
              Time:
            </strong>

            ${escapeHtml(
          cleanedPreferredTime ||
          "Not provided"
        )}
          </p>

          <h2>
            Special instructions
          </h2>

          <div
            style="
              padding: 15px;
              background-color: #f5f5f5;
              border-radius: 8px;
              line-height: 1.6;
            "
          >
            ${cleanedInstructions
          ? createMultilineHtml(
            cleanedInstructions
          )
          : "No special instructions provided."
        }
          </div>

          <div
            style="
              margin-top: 30px;
              padding: 18px;
              background-color: #fff8df;
              border: 1px solid #f0da91;
              border-radius: 8px;
            "
          >
            Please reply to the customer to
            confirm that the order has been
            received and accepted.
          </div>
        </div>
      `;

      const customerEmailHtml = `
        <div
          style="
            max-width: 700px;
            margin: auto;
            padding: 25px;
            color: #222222;
            font-family: Arial, sans-serif;
          "
        >
          <h1
            style="
              color: #e85d5d;
            "
          >
            We Received Your Order Request
          </h1>

          <p>
            Hello ${escapeHtml(
        fullName
      )},
          </p>

          <p>
            Thank you for submitting an order
            request to Aha'Adu Global Solutions.
          </p>

          <p>
            <strong>
              Order number:
            </strong>

            ${orderNumber}
          </p>

          <p>
            <strong>
              Order method:
            </strong>

            ${displayOrderMethod}
          </p>

          <h2>
            Your items
          </h2>

          <table
            style="
              width: 100%;
              border-collapse: collapse;
            "
          >
            <thead>
              <tr
                style="
                  background-color: #f3f3f3;
                "
              >
                <th
                  style="
                    padding: 12px;
                    text-align: left;
                  "
                >
                  Item
                </th>

                <th
                  style="
                    padding: 12px;
                    text-align: center;
                  "
                >
                  Quantity
                </th>

                <th
                  style="
                    padding: 12px;
                    text-align: right;
                  "
                >
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              ${customerTableRows}
            </tbody>
          </table>

          <h2
            style="
              text-align: right;
            "
          >
            Total:
            $${formatMoney(
        calculatedTotal
      )}
          </h2>

          <div
            style="
              margin-top: 25px;
              padding: 18px;
              background-color: #fff8df;
              border: 1px solid #f0da91;
              border-radius: 8px;
            "
          >
            <strong>
              Important:
            </strong>

            <p
              style="
                margin-bottom: 0;
              "
            >
              This email only confirms that
              your order request was submitted.

              Your order is not confirmed until
              Aha'Adu Global Solutions replies
              and confirms that it has been
              received and accepted.
            </p>
          </div>
        </div>
      `;

      await Promise.all([
        transporter.sendMail({
          from:
            `"Aha'Adu Website" <${process.env.EMAIL_USER}>`,

          to:
            process.env
              .OWNER_EMAIL,

          replyTo: email,

          subject:
            `New Order ${orderNumber} — ${fullName}`,

          html:
            ownerEmailHtml,

          text: `
New Website Order

Order number: ${orderNumber}
Order method: ${displayOrderMethod}

Customer:
Name: ${fullName}
Phone: ${phone}
Email: ${email}

Address:
${ownerAddressText}

Items:
${textOrderItems}

Total: $${formatMoney(
            calculatedTotal
          )}

Preferred date:
${cleanedPreferredDate ||
            "Not provided"
            }

Preferred time:
${cleanedPreferredTime ||
            "Not provided"
            }

Special instructions:
${cleanedInstructions ||
            "No special instructions provided."
            }

Please reply to the customer to confirm the order.
          `,
        }),

        transporter.sendMail({
          from:
            `"Aha'Adu Global Solutions" <${process.env.EMAIL_USER}>`,

          to: email,

          replyTo:
            process.env
              .OWNER_EMAIL,

          subject:
            `Your order request ${orderNumber}`,

          html:
            customerEmailHtml,

          text: `
Hello ${fullName},

We received your order request.

Order number: ${orderNumber}
Order method: ${displayOrderMethod}

Items:
${textOrderItems}

Total: $${formatMoney(
            calculatedTotal
          )}

This message confirms that your order request was submitted. Your order is not confirmed until Aha'Adu Global Solutions replies and confirms that it has been received and accepted.
          `,
        }),
      ]);

      return response
        .status(200)
        .json({
          success: true,

          message:
            "Your order request was sent successfully.",

          orderNumber,

          total: Number(
            calculatedTotal.toFixed(
              2
            )
          ),
        });
    } catch (error) {
      console.error(
        "Order processing error:",
        error
      );

      return response
        .status(500)
        .json({
          success: false,

          message:
            "The order could not be sent. Please try again.",
        });
    }
  }
);

/* Unknown API route */

app.use(
  "/api",
  (
    request,
    response
  ) => {
    return response
      .status(404)
      .json({
        success: false,

        message:
          "API route not found.",
      });
  }
);

/* Error handler */

app.use(
  (
    error,
    request,
    response,
    next
  ) => {
    if (
      error?.message ===
      "This website is not allowed to use the API."
    ) {
      return response
        .status(403)
        .json({
          success: false,

          message:
            error.message,
        });
    }

    console.error(
      "Unexpected server error:",
      error
    );

    return response
      .status(500)
      .json({
        success: false,

        message:
          "An unexpected server error occurred.",
      });
  }
);

/* Start backend */

app.listen(
  PORT,
  "0.0.0.0",
  async () => {
    console.log(
      `Aha'Adu backend is running on port ${PORT}.`
    );

    console.log(
      `Allowed frontend origins: ${allowedOrigins.join(
        ", "
      )}`
    );

    try {
      await transporter.verify();

      console.log(
        "Email account connected successfully."
      );
    } catch (error) {
      console.error(
        "Email connection failed:",
        error.message
      );
    }
  }
);