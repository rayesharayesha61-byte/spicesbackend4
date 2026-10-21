
// const express = require("express");
// const mysql = require("mysql2");
// const cors = require("cors");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const app = express();
// const axios = require("axios");

// async function translateToTamil(text) {
//   const res = await axios.get(
//     `https://api.mymemory.translated.net/get?q=${text}&langpair=en|ta`
//   );

//   return res.data.responseData.translatedText;
// }
// //  Middleware
// app.use(express.json());
// app.use(cors());
// app.use("/uploads", express.static("uploads"));

// //  Create uploads folder
// if (!fs.existsSync("uploads")) {
//   fs.mkdirSync("uploads");
// }

// //  DB Connection
// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "rayesha",
//   database: "spicedb",
// });

// db.connect((err) => {
//   if (err) {
//     console.log("DB Connection Error:", err);
//     return;
//   }
//   console.log(" MySQL Connected");
// });

// // Multer (Image Upload)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + path.extname(file.originalname);
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({ storage });
// app.post("/api/login", (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.json({
//       success: false,
//       message: "Missing fields",
//     });
//   }

//   const query = `
//     SELECT 
//       id,
//       name_en,
//       name_ta,
//       email,
//       role,
//       phone
//     FROM users 
//     WHERE email=? AND password=?
//   `;

//   db.query(query, [email.trim(), password.trim()], (err, results) => {
//     if (err) {
//       console.log("DB Error:", err);
//       return res.status(500).json({
//         success: false,
//         message: "Server error",
//       });
//     }

//     if (results.length > 0) {
//       const user = results[0];

//       return res.json({
//         success: true,
//         user: user,
//       });
//     } else {
//       return res.json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }
//   });
// });


// app.post("/api/create-dealer", upload.single("image"), async (req, res) => {
//   try {
//     let { name_en, name_ta, location, phone, aadhar } = req.body;

//     const image = req.file ? req.file.filename : null;

//     if (!name_en && !name_ta) {
//       return res.json({ success: false, message: "Name required" });
//     }

//     if (!location) {
//       return res.json({ success: false, message: "Location required" });
//     }

//     let location_en = location;
//     let location_ta = await translateToTamil(location);

//     if (!name_en) name_en = name_ta;
//     if (!name_ta) name_ta = name_en;

//     const dealerId = "D" + Date.now();
//     const password = Math.random().toString(36).slice(-8);

//     // ✅ FIRST CHECK COUNT
//     db.query(
//       "SELECT COUNT(*) as total FROM users WHERE role='dealer'",
//       (err, result) => {
//         if (err) {
//           return res.status(500).json({ success: false });
//         }

//         if (result[0].total >= 5) {
//           return res.json({
//             success: false,
//             message: "Only 5 dealers allowed",
//           });
//         }

//         // ✅ INSERT ONLY IF < 5
//         const query = `
//           INSERT INTO users 
//           (name_en, name_ta, email, password, role, phone, aadhar, location_en, location_ta, image)
//           VALUES (?, ?, ?, ?, 'dealer', ?, ?, ?, ?, ?)
//         `;

//         db.query(
//           query,
//           [
//             name_en,
//             name_ta,
//             dealerId,
//             password,
//             phone,
//             aadhar,
//             location_en,
//             location_ta,
//             image,
//           ],
//           (err) => {
//             if (err) {
//               console.log("INSERT ERROR:", err);
//               return res.status(500).json({ success: false });
//             }

//             return res.json({
//               success: true,
//               dealerId,
//               password,
//             });
//           }
//         );
//       }
//     );
//   } catch (err) {
//     console.log("SERVER ERROR:", err);
//     return res.status(500).json({ success: false });
//   }
// });

// app.post("/api/products", upload.single("image"), (req, res) => {
//   const { name, name_ta, description, price, origin, classType } = req.body;

//   const image = req.file ? req.file.filename : null;

//   if (!name || !price) {
//     return res.json({
//       success: false,
//       message: "Name and price required",
//     });
//   }

//   const query = `
//     INSERT INTO products 
//     (name, name_ta, description, price, origin, class_type, image)
//     VALUES (?, ?, ?, ?, ?, ?, ?)
//   `;

//   db.query(
//     query,
//     [
//       name,
//       name_ta || null, // ✅ important
//       description,
//       Number(price),
//       origin,
//       classType,
//       image,
//     ],
//     (err) => {
//       if (err) {
//         console.log("Insert Error:", err);
//         return res.status(500).json({ success: false });
//       }

//       res.json({
//         success: true,
//         message: "Product added",
//       });
//     }
//   );
// });
// /* =========================================
//     GET PRODUCTS 
// ========================================= */
// app.get("/products", (req, res) => {
//   db.query("SELECT * FROM products", (err, result) => {
//     if (err) return res.status(500).json({ success: false });

//     // ✅ Add full image URL
//     const updated = result.map((item) => ({
//       ...item,
//       image: item.image
//         ? `http://192.168.29.155:5000/uploads/${item.image}`
//         : null,
//     }));

//     res.json(updated);
//   });
// });



// app.get("/dealers", (req, res) => {
//   try {
//     const lang = req.query.lang || "en";

//     const sql = `
//       SELECT 
//         id,
//         name_en,
//         name_ta,
//         phone,
//         location_en,
//         location_ta
//       FROM users 
//       WHERE role = 'dealer'
//     `;

//     db.query(sql, (err, result) => {
//       if (err) {
//         console.log("DB ERROR:", err);
//         return res.status(500).json({ success: false });
//       }

//       const formatted = result.map((d) => ({
//         id: d.id,
//         name: lang === "ta" ? d.name_ta : d.name_en,
//         location: lang === "ta" ? d.location_ta : d.location_en,
//         phone: d.phone,
//       }));

//       return res.json(formatted); // ✅ single response
//     });
//   } catch (err) {
//     console.log("SERVER ERROR:", err);
//     res.status(500).json({ success: false });
//   }
// });
// app.post("/update-payment", (req, res) => {
//   const { orderId, paymentStatus } = req.body;

//   db.query(
//     "UPDATE orders SET payment_status=? WHERE id=?",
//     [paymentStatus, orderId],
//     (err) => {
//       if (err) return res.json({ success: false });

//       res.json({ success: true });
//     }
//   );
// });
// // =====================================
// // 💰 MONTHLY REVENUE
// // =====================================
// app.get("/monthly-revenue", (req, res) => {
//  const sql = `
//   SELECT IFNULL(SUM(
//     CASE 
//       WHEN total_price IS NOT NULL THEN total_price 
//       ELSE total 
//     END
//   ), 0) AS total
//   FROM orders
//   WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
//     AND YEAR(created_at) = YEAR(CURRENT_DATE())
// `;

//   db.query(sql, (err, result) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).json({ error: "DB error" });
//     }

//     res.json({
//       total: result[0].total || 0,
//     });
//   });
// });

// app.get("/orders", (req, res) => {
//   db.query("SELECT * FROM orders ORDER BY id DESC", (err, result) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).json({ message: "DB error" });
//     }

//     res.json(result);
//   });
// });
// //  Update admin profile
// app.put("/admin/update", (req, res) => {
//   const { email, password } = req.body;

//   if (!email) {
//     return res.status(400).json({ success: false, message: "Email is required" });
//   }

//   // Only update password if provided
//   let query = "UPDATE users SET email = ?";
//   const params = [email];

//   if (password) {
//     query += ", password = ?";
//     params.push(password);
//   }

//   query += " WHERE role = 'admin' LIMIT 1";

//   db.query(query, params, (err, result) => {
//     if (err) {
//       console.log("DB Error:", err);
//       return res.status(500).json({ success: false, message: "DB error" });
//     }

//     res.json({ success: true, message: "Profile updated successfully" });
//   });
// });
// app.delete("/products/:id", (req, res) => {
//   const { id } = req.params;

//   db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
//     if (err) return res.status(500).send(err);
//     res.send({ message: "Deleted successfully" });
//   });
// });
// app.put("/products/:id", (req, res) => {
//   const { name, price } = req.body;
//   const { id } = req.params;

//   db.query(
//     "UPDATE products SET name=?, price=? WHERE id=?",
//     [name, price, id],
//     (err) => {
//       if (err) return res.status(500).send(err);
//       res.send({ message: "Updated successfully" });
//     }
//   );
// });

// app.get("/admin/profile", (req, res) => {
//   const query = "SELECT * FROM users WHERE role = 'admin' LIMIT 1";

//   db.query(query, (err, result) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).json({ message: "DB error" });
//     }

//     if (result.length === 0) return res.json({});

//     res.json(result[0]); // ✅ returns the admin user
//   });
// });

// app.get("/dealer-details/:dealerId", (req, res) => {
//   const dealerId = req.params.dealerId;

//   const summaryQuery = `
//     SELECT 
//       COUNT(*) AS total_orders,
//       IFNULL(SUM(total), 0) AS total_sales,
//       COUNT(DISTINCT shop_id) AS total_shops
//     FROM orders
//     WHERE dealer_id = ?
//     AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = CURDATE()
//   `;

//   const shopWiseQuery = `
//     SELECT 
//       o.id AS shop_id,
//       o.shop_name,
//       o.shop_name_ta,
//       DATE(CONVERT_TZ(or1.created_at, '+00:00', '+05:30')) AS last_order_date,
//       COUNT(or1.id) AS total_bills,
//       IFNULL(SUM(or1.total), 0) AS total_amount
//     FROM orders or1
//     JOIN outlets o ON o.id = or1.shop_id
//     WHERE or1.dealer_id = ?
//     GROUP BY 
//       o.id, 
//       o.shop_name, 
//       o.shop_name_ta, 
//       DATE(CONVERT_TZ(or1.created_at, '+00:00', '+05:30'))
//     ORDER BY last_order_date DESC
//   `;

//   db.query(summaryQuery, [dealerId], (err, summary) => {
//     if (err) return res.status(500).json({ message: "Summary error", err });

//     db.query(shopWiseQuery, [dealerId], (err2, shops) => {
//       if (err2) return res.status(500).json({ message: "Shop error", err2 });

//       res.json({
//         total_orders: summary[0]?.total_orders || 0,
//         total_sales: summary[0]?.total_sales || 0,
//         total_shops: summary[0]?.total_shops || 0,
//         shops: shops || [],
//       });
//     });
//   });
// });
// // ✅ APPROVE (mark as Paid)
// app.put("/orders/:id/approve", (req, res) => {
//   const { id } = req.params;

//   const query = `
//     UPDATE orders 
//     SET payment_status = 'Paid' 
//     WHERE id = ?
//   `;

//   db.query(query, [id], (err, result) => {
//     if (err) {
//       console.log("APPROVE ERROR 👉", err); // 🔥 PRINT REAL ERROR
//       return res.json({ success: false, error: err.message });
//     }

//     console.log("RESULT 👉", result); // 🔥 DEBUG

//     res.json({ success: true });
//   });
// });


// // ❌ CANCEL (mark as Cancelled)
// app.put("/orders/:id/cancel", (req, res) => {
//   const { id } = req.params;

//   const query = `
//     UPDATE orders 
//     SET payment_status = 'Cancelled' 
//     WHERE id = ?
//   `;

//   db.query(query, [id], (err) => {
//     if (err) return res.json({ success: false });

//     res.json({ success: true });
//   });
// });



// app.post("/create-order", (req, res) => {
//   console.log("BODY 👉", req.body);

//   const {
//     shopId,
//     dealerId,
//     total,
//     paymentMethod,
//     items,
//     gst,
//   } = req.body;

//   console.log("ITEMS 👉", items);

//   // 🔍 Check pending count
//   const checkSql = `
//     SELECT COUNT(*) as pendingCount
//     FROM orders
//     WHERE shop_id = ? AND payment_status = 'Pending'
//   `;

//   db.query(checkSql, [shopId], (err, result) => {
//     if (err) {
//       console.log(err);
//       return res.json({ success: false });
//     }

//     const pendingCount = result[0].pendingCount;

//     // ❌ Block after 2 pending orders
//     if (pendingCount >= 2 && paymentMethod === "pending") {

//       const pendingSql = `
//         SELECT *
//         FROM orders
//         WHERE shop_id = ? AND payment_status = 'Pending'
//       `;

//       db.query(pendingSql, [shopId], (err2, orders) => {
//         if (err2) {
//           console.log(err2);
//           return res.json({ success: false });
//         }

//         const totalPending = orders.reduce(
//           (sum, o) => sum + Number(o.total),
//           0
//         );

//         return res.json({
//           success: false,
//           message: "⚠️ 2 Pending reached. Pay previous orders",
//           pendingOrders: orders,
//           pendingAmount: totalPending,
//         });
//       });

//       return;
//     }

//     // ✅ Payment status
//     const status =
//       paymentMethod === "pending"
//         ? "Pending"
//         : "Paid";

//     // ✅ Fetch dealer name
//     db.query(
//       "SELECT name_en, name_ta FROM users WHERE id = ?",
//       [dealerId],
//       (err2, dealerResult) => {

//         if (err2) {
//           console.log(err2);
//           return res.json({ success: false });
//         }

//         const dealer =
//           dealerResult.length > 0
//             ? dealerResult[0]
//             : null;

//         console.log("DEALER 👉", dealer);

//         // ✅ Insert order
//         const insertSql = `
//           INSERT INTO orders
//           (
//             shop_id,
//             dealer_id,
//             dealer_name,
//             total,
//             payment_method,
//             payment_status,
//             items,
//             gst
//           )
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//        db.query(
//   insertSql,
//   [
//     shopId,
//     dealerId,

//     dealer?.name_ta ||
//     dealer?.name_en ||
//     "Dealer User",

//     total,
//     paymentMethod,
//     status,
//     JSON.stringify(items),
//     gst,
//   ],
//   (err3, result3) => {

//     if (err3) {
//       console.log(err3);
//       return res.json({ success: false });
//     }

//     return res.json({
//       success: true,
//       orderId: result3.insertId,
//       dealer: dealer,
//     });
//   }
// );
//       }
//     );
//   });
// });
// app.post("/api/pay-pending", (req, res) => {
//   const { shopId } = req.body;

//   const sql = `
//     UPDATE orders 
//     SET payment_status = 'Paid' 
//     WHERE shop_id = ? AND payment_status = 'Pending'
//   `;

//   db.query(sql, [shopId], (err) => {
//     if (err) return res.json({ success: false });

//     res.json({ success: true });
//   });
// });
// app.post("/api/pay-single", (req, res) => {
//   const { orderId } = req.body;

//   const sql = "UPDATE orders SET payment_status='Paid' WHERE id=?";

//   db.query(sql, [orderId], (err) => {
//     if (err) {
//       return res.json({ success: false });
//     }

//     res.json({ success: true });
//   });
// });


// const regionMap = {
//   chennai: "சென்னை",
//   madurai: "மதுரை",
//   ramnad: "ராமநாதபுரம்",
//   karaikudi: "காரைக்குடி",
//   thirunelveli: "திருநெல்வேலி",
// };


// app.post("/create-outlet", async (req, res) => {
//   try {
//     const { shopName, region, phone, address, dealerId } = req.body;

//     const shopName_ta = await translateToTamil(shopName);
//     const address_ta = await translateToTamil(address);

//     // ✅ IMPORTANT FIX
//     const region_ta = regionMap[region] || region;

//     const sql = `
//       INSERT INTO outlets 
//       (shop_name, shop_name_ta, region, region_ta, phone, address, address_ta, dealer_id)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     db.query(
//       sql,
//       [shopName, shopName_ta, region, region_ta, phone, address, address_ta, dealerId],
//       (err) => {
//         if (err) return res.json({ success: false });

//         res.json({ success: true });
//       }
//     );
//   } catch (err) {
//     res.json({ success: false });
//   }
// });
// /* GET ALL OUTLETS */
// app.get("/outlets", (req, res) => {
//   db.query("SELECT * FROM outlets ORDER BY id DESC", (err, result) => {
//     if (err) return res.status(500).json(err);

//     res.json(result);
//   });
// });

// /* DELETE OUTLET */
// app.delete("/delete-outlet/:id", (req, res) => {
//   const { id } = req.params;

//   db.query("DELETE FROM outlets WHERE id = ?", [id], (err) => {
//     if (err) return res.status(500).json(err);

//     res.json({
//       success: true,
//       message: "Deleted successfully",
//     });
//   });
// });
// //  GET PROFILE BY ID

// app.post("/api/upload-profile/:id", upload.single("image"), (req, res) => {
//   const { id } = req.params;
//   const image = req.file ? req.file.filename : null;

//   if (!image) {
//     return res.json({ success: false });
//   }

//   db.query(
//     "UPDATE users SET image = ? WHERE id = ?",
//     [image, id],
//     (err) => {
//       if (err) return res.status(500).json({ success: false });

//       res.json({
//         success: true,
//         imageUrl: `http://192.168.29.155:5000/uploads/${image}`,
//       });
//     }
//   );
// });
// app.get("/api/profile/:id", (req, res) => {
//   const { id } = req.params;

//   db.query("SELECT * FROM users WHERE id = ?", [id], (err, result) => {
//     if (err) return res.status(500).json({ success: false });

//     if (result.length > 0) {
//       const user = result[0];

//       // ✅ Convert image filename → full URL
//       user.image = user.image
//         ? `http://192.168.29.155:5000/uploads/${user.image}`
//         : null;

//       res.json({
//         success: true,
//         user,
//       });
//     } else {
//       res.json({ success: false });
//     }
//   });
// });

// app.get("/outlets", (req, res) => {
//   db.query("SELECT * FROM outlets", (err, result) => {
//     if (err) return res.status(500).json(err);
//     res.json(result);
//   });
// });

// app.get("/api/dealer-sales/:id", (req, res) => {
//   const dealerId = req.params.id;

//   const sql = `
//     SELECT SUM(total) AS totalSales
//     FROM orders
//     WHERE dealer_id = ?
//     AND DATE(created_at) = CURDATE()
//   `;

//   db.query(sql, [dealerId], (err, result) => {
//     if (err) return res.status(500).json({ success: false });

//     res.json({
//       success: true,
//       totalSales: result[0].totalSales || 0,
//     });
//   });
// });
// app.get("/api/dealer-shops/:id", (req, res) => {
//   const dealerId = req.params.id;

//   const sql = `
//     SELECT COUNT(DISTINCT shop_id) AS totalShops
//     FROM orders
//     WHERE dealer_id = ?
//     AND DATE(created_at) = CURDATE()
//   `;

//   db.query(sql, [dealerId], (err, result) => {
//     if (err) return res.status(500).json({ success: false });

//     res.json({
//       success: true,
//       totalShops: result[0].totalShops || 0,
//     });
//   });
// });


// // app.listen(5000, "0.0.0.0", () => {
// //   console.log("🚀 Server running on port 5000");
// // });
// app.get("/api", (req, res) => {
//   res.send("API Working ✅");
// });

// app.listen(5000, "0.0.0.0", () => {
//   console.log("🚀 Server running on port 5000");
// });
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const crypto = require("crypto");

const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

const BASE_URL =
  process.env.BASE_URL || "http://192.168.29.155:5000";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Uploads folder
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

// MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "spicedb",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Check database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }

  console.log("MySQL connected successfully");
  connection.release();
});

// Multer image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });
async function translateToTamil(text) {
  if (!text || !String(text).trim()) {
    return "";
  }

  try {
    const response = await axios.get(
      "https://api.mymemory.translated.net/get",
      {
        params: {
          q: String(text),
          langpair: "en|ta",
        },
        timeout: 10000,
      }
    );

    return (
      response.data?.responseData?.translatedText ||
      String(text)
    );
  } catch (error) {
    console.error("Tamil translation error:", error.message);
    return String(text);
  }
}











const mailer = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
});

mailer.verify((error) => {
  if (error) {
    console.error("SMTP ERROR:", error.code, error.message);
  } else {
    console.log("Brevo SMTP connection successful");
  }
});






// Run once when the server starts.
// Creates a separate table without changing the users table.
db.query(
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id)
  )`,
  (err) => {
    if (err) {
      console.error("RESET TOKEN TABLE ERROR:", err.message);
    } else {
      console.log("Password reset token table ready");
    }
  }
);


// Health check
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Spice API is working",
  });
});
// const express = require("express");
// const mysql = require("mysql2");
// const cors = require("cors");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const app = express();
// const axios = require("axios");
// require("dotenv").config();
// console.log(process.env.DB_HOST);
// console.log(process.env.DB_PORT);
// async function translateToTamil(text) {
//   const res = await axios.get(
//     `https://api.mymemory.translated.net/get?q=${text}&langpair=en|ta`
//   );

//   return res.data.responseData.translatedText;
// }

// //  Middleware
// app.use(express.json());
// app.use(cors());
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// //  Create uploads folder
// if (!fs.existsSync("uploads")) {
//   fs.mkdirSync("uploads", { recursive: true });
// }

// //  DB Connection

// // DB Connection
// // console.log("DB HOST", process.env.DB_HOST);
// // console.log("DB PORT", process.env.DB_PORT);



// const BASE_URL = process.env.BASE_URL || "http://192.168.29.155:5000";


// // const db = mysql.createPool({
// //   host: process.env.DB_HOST,
// //   user: process.env.DB_USER,
// //   password: process.env.DB_PASSWORD,
// //   database: process.env.DB_NAME,
// //   port: Number(process.env.DB_PORT),

// //   waitForConnections: true,
// //   connectionLimit: 10,
// //   queueLimit: 0,

// //   ssl: {
// //     rejectUnauthorized: false,
// //   },
// // });

// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: Number(process.env.DB_PORT || 3306),
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// db.getConnection((err, connection) => {
//   if (err) {
//     console.error("Database connection failed:", err.message);
//     return;
//   }

//   console.log("MySQL Connected Successfully");
//   connection.release();
// });
// // db.connect((err) => {
// //   if (err) {
// //     console.log("DB Connection Error:", err);
// //     return;
// //   }
// //   console.log(" MySQL Connected");
// // });


// // Multer (Image Upload)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, "uploads"));
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + path.extname(file.originalname);
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({ storage });


// app.post("/api/login", (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.json({
//       success: false,
//       message: "Missing fields",
//     });
//   }

//   const query = `
//     SELECT 
//       id,
//       name_en,
//       name_ta,
//       email,
//       role,
//       phone
//     FROM users 
//     WHERE email=? AND password=?
//   `;

//   db.query(query, [email.trim(), password.trim()], (err, results) => {
//    if (err) {
//   console.log("DB Error:", err);

//   return res.status(500).json({
//     success: false,
//     error: err.message,
//   });
// }

//     if (results.length > 0) {
//       const user = results[0];

//       return res.json({
//         success: true,
//         user: user,
//       });
//     } else {
//       return res.json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }
//   });
// });


// // app.post("/api/create-dealer", upload.single("image"), async (req, res) => {
// //   try {
// //     let { name_en, name_ta, location, phone, aadhar } = req.body;

// //     const image = req.file ? req.file.filename : null;

// //     if (!name_en && !name_ta) {
// //       return res.json({ success: false, message: "Name required" });
// //     }

// //     if (!location) {
// //       return res.json({ success: false, message: "Location required" });
// //     }

// //     let location_en = location;
// //     let location_ta = await translateToTamil(location);

// //     if (!name_en) name_en = name_ta;
// //     if (!name_ta) name_ta = name_en;

// //     const dealerId = "D" + Date.now();
// //     const password = Math.random().toString(36).slice(-8);

// //     // ✅ FIRST CHECK COUNT
// //     db.query(
// //       "SELECT COUNT(*) as total FROM users WHERE role='dealer'",
// //       (err, result) => {
// //         if (err) {
// //           return res.status(500).json({ success: false });
// //         }

// //         if (result[0].total >= 5) {
// //           return res.json({
// //             success: false,
// //             message: "Only 5 dealers allowed",
// //           });
// //         }

// //         // ✅ INSERT ONLY IF < 5
// //         const query = `
// //           INSERT INTO users 
// //           (name_en, name_ta, email, password, role, phone, aadhar, location_en, location_ta, image)
// //           VALUES (?, ?, ?, ?, 'dealer', ?, ?, ?, ?, ?)
// //         `;

// //         db.query(
// //           query,
// //           [
// //             name_en,
// //             name_ta,
// //             dealerId,
// //             password,
// //             phone,
// //             aadhar,
// //             location_en,
// //             location_ta,
// //             image,
// //           ],
// //           (err) => {
// //             if (err) {
// //               console.log("INSERT ERROR:", err);
// //               return res.status(500).json({ success: false });
// //             }

// //             return res.json({
// //               success: true,
// //               dealerId,
// //               password,
// //             });
// //           }
// //         );
// //       }
// //     );
// //   } catch (err) {
// //     console.log("SERVER ERROR:", err);
// //     return res.status(500).json({ success: false });
// //   }
// // });
// app.post("/api/create-dealer", upload.single("image"), async (req, res) => {
//   try {
//     // ✅ SAFE BODY READ
//     let { name_en, name_ta, location, phone, aadhar } = req.body || {};

//     // ✅ SAFE IMAGE HANDLING
//     const image = req.file ? req.file.filename : null;

//     // 🔥 VALIDATION (SAFE)
//     if (!name_en?.trim() && !name_ta?.trim()) {
//       return res.json({
//         success: false,
//         message: "Name required",
//       });
//     }

//     if (!location?.trim()) {
//       return res.json({
//         success: false,
//         message: "Location required",
//       });
//     }

//     // ✅ DEFAULT NAME FIX
//     if (!name_en) name_en = name_ta;
//     if (!name_ta) name_ta = name_en;

//     // 🔥 LOCATION TRANSLATION
//     let location_en = location;
//     let location_ta = await translateToTamil(location);

//     // 🔥 UNIQUE DEALER ID
//     const dealerId = "D" + Date.now();

//     // ⚠️ Email fixed (safe unique)
//     const email = `${dealerId}@dealer.com`;

//     // 🔥 PASSWORD GENERATE
//     const password = Math.random().toString(36).slice(-8);

//     // 🔥 COUNT DEALERS LIMIT CHECK
//     db.query(
//       "SELECT COUNT(*) as total FROM users WHERE role='dealer'",
//       (err, result) => {
//         if (err) {
//           console.log("COUNT ERROR:", err);
//           return res.status(500).json({
//             success: false,
//             message: "Database error",
//           });
//         }

//         if (result[0].total >= 5) {
//           return res.json({
//             success: false,
//             message: "Only 5 dealers allowed",
//           });
//         }

//         // 🔥 INSERT DEALER
//         const query = `
//           INSERT INTO users 
//           (name_en, name_ta, email, password, role, phone, aadhar, location_en, location_ta, image)
//           VALUES (?, ?, ?, ?, 'dealer', ?, ?, ?, ?, ?)
//         `;

//         db.query(
//           query,
//           [
//             name_en,
//             name_ta,
//             email,
//             password,
//             phone,
//             aadhar,
//             location_en,
//             location_ta,
//             image,
//           ],
//           (err) => {
//                if (err) {
//   console.log("INSERT ERROR:", err);  // 👈 must
//   return res.status(500).json({
//     success: false,
//     message: err.sqlMessage || err.message
//   });
// }

//             return res.json({
//               success: true,
//               dealerId,
//               password,
//             });
//           }
//         );
//       }
//     );
//   } catch (err) {
//     console.log("SERVER ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });

const bcrypt = require("bcryptjs");

app.post("/api/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter email and password",
    });
  }

  const sql = `
    SELECT id, name_en, name_ta, email, password, role, phone
    FROM users
    WHERE LOWER(email) = ?
    LIMIT 1
  `;

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("LOGIN ERROR:", err.message);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (!results || results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = results[0];
    const storedPassword = String(user.password || "");
    let isMatch = false;

    try {
      // Verify bcrypt-hashed passwords
      if (
        storedPassword.startsWith("$2a$") ||
        storedPassword.startsWith("$2b$") ||
        storedPassword.startsWith("$2y$")
      ) {
        isMatch = await bcrypt.compare(password, storedPassword);
      } else {
        // Support existing plain-text passwords temporarily
        isMatch = password === storedPassword;
      }
    } catch (passwordError) {
      console.error("PASSWORD VERIFY ERROR:", passwordError.message);
      return res.status(500).json({
        success: false,
        message: "Could not verify password",
      });
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Return user details without password
    const { password: ignoredPassword, ...safeUser } = user;

    return res.json({
      success: true,
      user: safeUser,
    });
  });
});


app.post(
  "/api/create-dealer",
  upload.single("image"),
  async (req, res) => {
    try {
      let {
        name_en,
        name_ta,
        phone,
        aadhar,
        location,
      } = req.body || {};

      // Clean input values
      name_en = (name_en || "").trim();
      name_ta = (name_ta || "").trim();
      phone = (phone || "").trim();
      aadhar = (aadhar || "").trim();
      location = (location || "").trim();

      const image = req.file ? req.file.filename : null;

      // 1. Validate dealer name
      if (!name_en && !name_ta) {
        return res.status(400).json({
          success: false,
          message: "Enter dealer name",
        });
      }

      // 2. Validate phone
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Phone number must contain 10 digits",
        });
      }

      // 3. Validate Aadhaar
      if (!/^\d{12}$/.test(aadhar)) {
        return res.status(400).json({
          success: false,
          message: "Aadhaar number must contain 12 digits",
        });
      }

      // 4. Validate location
      if (!location) {
        return res.status(400).json({
          success: false,
          message: "Enter dealer location",
        });
      }

      // Use the available name for both language fields
      name_en = name_en || name_ta;
      name_ta = name_ta || name_en;

      // Generate unique login details
      const dealerId = "D" + Date.now();
      const email = `${dealerId}@dealer.local`;
      const password = Math.random().toString(36).slice(2, 10);

      // Translate location to Tamil if available
      let location_ta = location;

      try {
        if (typeof translateToTamil === "function") {
          const translatedLocation =
            await translateToTamil(location);

          if (translatedLocation) {
            location_ta = translatedLocation;
          }
        }
      } catch (translationError) {
        console.error(
          "Location translation failed:",
          translationError.message
        );
      }

      // 5. Check the maximum dealer limit
      db.query(
        "SELECT COUNT(*) AS total FROM users WHERE role = 'dealer'",
        (countError, countResults) => {
          if (countError) {
            console.error(
              "DEALER COUNT MYSQL ERROR:",
              countError.code,
              countError.sqlMessage || countError.message
            );

            return res.status(500).json({
              success: false,
              message: "Failed to check dealer limit",
              code: countError.code,
            });
          }

          const total = Number(countResults?.[0]?.total || 0);

          if (total >= 5) {
            return res.status(400).json({
              success: false,
              message: "Only 5 dealers are allowed",
            });
          }

          // 6. Insert into Cloud MySQL users table
          const sql = `
            INSERT INTO users (
              name_en,
              name_ta,
              email,
              password,
              role,
              phone,
              aadhar,
              location_en,
              location_ta,
              image
            )
            VALUES (?, ?, ?, ?, 'dealer', ?, ?, ?, ?, ?)
          `;

          const values = [
            name_en,
            name_ta,
            email,
            password,
            phone,
            aadhar,
            location,
            location_ta,
            image,
          ];

          db.query(sql, values, (insertError, result) => {
            if (insertError) {
              console.error(
                "========== CREATE DEALER MYSQL ERROR =========="
              );
              console.error("Code:", insertError.code);
              console.error(
                "Message:",
                insertError.sqlMessage || insertError.message
              );
              console.error("SQL State:", insertError.sqlState);
              console.error(
                "==============================================="
              );

              return res.status(500).json({
                success: false,
                message:
                  insertError.sqlMessage ||
                  "Unable to save dealer details",
                code: insertError.code,
              });
            }

            console.log(
              "Dealer saved successfully. Database ID:",
              result.insertId
            );

            return res.status(201).json({
              success: true,
              message: "Dealer created successfully",
              id: result.insertId,
              dealerId,
              email,
              password,
            });
          });
        }
      );
    } catch (error) {
      console.error("CREATE DEALER ROUTE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
);

// app.post("/api/products", upload.single("image"), (req, res) => {
//   console.log("FILE RECAIVED",req.file);
//   const { name, name_ta, description, price, origin, classType } = req.body;

//   const image = req.file ? req.file.filename : null;

//   if (!name || !price) {
//     return res.json({
//       success: false,
//       message: "Name and price required",
//     });
//   }

//   const query = `
//     INSERT INTO products 
//     (name, name_ta, description, price, origin, class_type, image)
//     VALUES (?, ?, ?, ?, ?, ?, ?)
//   `;

//   db.query(
//     query,
//     [
//       name,
//       name_ta || null, // ✅ important
//       description,
//       Number(price),
//       origin,
//       classType,
//       image,
//     ],
//     (err) => {
//       if (err) {
//         console.log("Insert Error:", err);
//         return res.status(500).json({ success: false });
//       }

//       res.json({
//         success: true,
//         message: "Product added",
//       });
//     }
//   );
// });
// /* =========================================
//     GET PRODUCTS 
// ========================================= */
// app.get("/products", (req, res) => {
//   db.query("SELECT * FROM products", (err, result) => {
//     if (err) return res.status(500).json({ success: false });

//     // ✅ Add full image URL
//     const updated = result.map((item) => ({
//       ...item,
//       image: item.image
//         ? `${process.env.BASE_URL}/uploads/${item.image}`
//         : null,
//     }));

//     res.json(updated);
//   });
// });


/* =========================================
   ADD PRODUCT WITH INITIAL STOCK
========================================= */


app.post("/api/products", (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("IMAGE UPLOAD ERROR:", err);

      return res.status(400).json({
        success: false,
        message: err.message || "Image upload failed",
      });
    }

    next();
  });
}, (req, res) => {
  console.log("FILE RECEIVED:", req.file);

  const {
    name,
    name_ta,
    description,
    price,
    origin,
    classType,
    stockQuantity,
  } = req.body;

  const productName = typeof name === "string" ? name.trim() : "";
  const productPrice = Number(price);
  const stock = Number(stockQuantity);

  // Validate product name
  if (!productName) {
    return res.status(400).json({
      success: false,
      message: "Product name is required",
    });
  }

  // Validate price
  if (
    price === undefined ||
    price === "" ||
    !Number.isFinite(productPrice) ||
    productPrice < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid product price",
    });
  }

  // Validate initial stock quantity
  if (
    stockQuantity === undefined ||
    stockQuantity === "" ||
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid stock quantity",
    });
  }

  const image = req.file ? req.file.filename : null;

  const query = `
    INSERT INTO products (
      name,
      name_ta,
      description,
      price,
      origin,
      class_type,
      image,
      stock_quantity
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    productName,
    typeof name_ta === "string" ? name_ta.trim() || null : null,
    typeof description === "string"
      ? description.trim() || null
      : null,
    productPrice,
    origin || null,
    classType || "Whole",
    image,
    stock,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("INSERT PRODUCT ERROR:", err);

      // Remove uploaded file if the database insert fails
      if (req.file) {
        const fs = require("fs");
        const path = require("path");
        const filePath = path.join(
          __dirname,
          "uploads",
          req.file.filename
        );

        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("IMAGE CLEANUP ERROR:", unlinkErr.message);
          }
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to add product",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      productId: result.insertId,
      stockQuantity: stock,
      image: image,
    });
  });
});

// =====================================
// ADMIN SALES REPORT - DATE FILTER
// =====================================
app.get("/api/admin-sales-summary", (req, res) => {
  const { startDate, endDate } = req.query;

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (
    !startDate ||
    !endDate ||
    !datePattern.test(startDate) ||
    !datePattern.test(endDate) ||
    startDate > endDate
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid startDate and endDate are required",
    });
  }

  const summarySql = `
    SELECT
      COUNT(*) AS totalOrders,
      COUNT(DISTINCT dealer_id) AS totalDealers,
      COALESCE(
        SUM(COALESCE(total_price, total, 0)), 0
      ) AS totalSales
    FROM orders
    WHERE DATE(created_at) BETWEEN ? AND ?
      AND (payment_status IS NULL
           OR payment_status != 'Cancelled')
  `;

  const dealerSql = `
    SELECT
      dealer_id AS dealerId,
      MAX(dealer_name) AS dealerName,
      COUNT(*) AS totalOrders,
      COALESCE(
        SUM(COALESCE(total_price, total, 0)), 0
      ) AS totalSales
    FROM orders
    WHERE DATE(created_at) BETWEEN ? AND ?
      AND (payment_status IS NULL
           OR payment_status != 'Cancelled')
    GROUP BY dealer_id
    ORDER BY totalSales DESC
  `;

  db.query(summarySql, [startDate, endDate], (err, summary) => {
    if (err) {
      console.log("SALES SUMMARY ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch sales summary",
      });
    }

    db.query(dealerSql, [startDate, endDate], (err, dealers) => {
      if (err) {
        console.log("DEALER SALES ERROR:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch dealer sales",
        });
      }

      return res.json({
        success: true,
        startDate,
        endDate,
        totalSales: Number(summary[0].totalSales || 0),
        totalOrders: Number(summary[0].totalOrders || 0),
        totalDealers: Number(summary[0].totalDealers || 0),
        dealerSales: dealers.map((dealer) => ({
          ...dealer,
          totalOrders: Number(dealer.totalOrders || 0),
          totalSales: Number(dealer.totalSales || 0),
        })),
      });
    });
  });
});
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) {
      console.log("Fetch Products Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }

    const updated = result.map((item) => ({
      ...item,
      image: item.image
        ? `${process.env.BASE_URL}/uploads/${item.image}`
        : null,
    }));

    res.json(updated);
  });
});

app.get("/dealers", (req, res) => {
  try {
    const lang = req.query.lang || "en";

    const sql = `
      SELECT
        id,
        email,
        name_en,
        name_ta,
        phone,
        location_en,
        location_ta
      FROM users
      WHERE role = 'dealer'
    `;

    db.query(sql, (err, result) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({
          success: false,
          message: "Unable to fetch dealers",
        });
      }

      const formatted = result.map((d) => ({
        id: d.id,
        email: d.email,
        name:
          lang === "ta"
            ? d.name_ta
            : d.name_en,
        location:
          lang === "ta"
            ? d.location_ta
            : d.location_en,
        phone: d.phone,
      }));

      return res.json(formatted);
    });
  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
app.post("/update-payment", (req, res) => {
  const { orderId, paymentStatus } = req.body;

  db.query(
    "UPDATE orders SET payment_status=? WHERE id=?",
    [paymentStatus, orderId],
    (err) => {
      if (err) return res.json({ success: false });

      res.json({ success: true });
    }
  );
});
// =====================================
// 💰 MONTHLY REVENUE
// =====================================
app.get("/monthly-revenue", (req, res) => {
 const sql = `
  SELECT IFNULL(SUM(
    CASE 
      WHEN total_price IS NOT NULL THEN total_price 
      ELSE total 
    END
  ), 0) AS total
  FROM orders
  WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
    AND YEAR(created_at) = YEAR(CURRENT_DATE())
`;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "DB error" });
    }

    res.json({
      total: result[0].total || 0,
    });
  });
});

app.get("/orders", (req, res) => {
  db.query("SELECT * FROM orders ORDER BY id DESC", (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "DB error" });
    }

    res.json(result);
  });
});
//  Update admin profile
app.put("/admin/update", (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  // Only update password if provided
  let query = "UPDATE users SET email = ?";
  const params = [email];

  if (password) {
    query += ", password = ?";
    params.push(password);
  }

  query += " WHERE role = 'admin' LIMIT 1";

  db.query(query, params, (err, result) => {
    if (err) {
      console.log("DB Error:", err);
      return res.status(500).json({ success: false, message: "DB error" });
    }

    res.json({ success: true, message: "Profile updated successfully" });
  });
});
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Deleted successfully" });
  });
});
// 🗑️ DELETE PARTICULAR DEALER
app.delete("/api/dealers/:id", (req, res) => {
  const dealerId = Number(req.params.id);

  if (!Number.isInteger(dealerId) || dealerId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid dealer ID",
    });
  }

  const sql = `
    DELETE FROM users
    WHERE id = ? AND role = 'dealer'
  `;

  db.query(sql, [dealerId], (err, result) => {
    if (err) {
      console.error("Delete dealer error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to delete dealer",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found",
      });
    }

    return res.json({
      success: true,
      message: "Dealer deleted successfully",
      dealerId,
    });
  });
});
// Get dealer details by dealer database ID
app.get("/api/dealer/:id/credentials", async (req, res) => {
  try {
    const dealerId = Number(req.params.id);

    if (!Number.isInteger(dealerId) || dealerId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid dealer ID",
      });
    }

    const [rows] = await db.execute(
      `SELECT id, email, name_en
       FROM users
       WHERE id = ? AND role = 'dealer'`,
      [dealerId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found",
      });
    }

    res.json({
      success: true,
      dealer: {
        id: rows[0].id,
        dealerId: rows[0].email,
        name: rows[0].name_en,
      },
    });
  } catch (error) {
    console.error("Dealer details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
app.put("/products/:id", (req, res) => {
  const { name, price, description, stock_quantity } = req.body;
  const { id } = req.params;

  if (!name || price === undefined || stock_quantity === undefined) {
    return res.status(400).json({
      message: "Name, price and stock quantity are required",
    });
  }

  const sql = `
    UPDATE products
    SET name = ?, price = ?, description = ?, stock_quantity = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, price, description || "", stock_quantity, id],
    (err, result) => {
      if (err) {
        console.error("UPDATE PRODUCT ERROR:", err);
        return res.status(500).json({
          message: "Failed to update product",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json({
        message: "Product updated successfully",
      });
    }
  );
});


app.get("/admin/profile", (req, res) => {
  const query = "SELECT * FROM users WHERE role = 'admin' LIMIT 1";

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "DB error" });
    }

    if (result.length === 0) return res.json({});

    res.json(result[0]); // ✅ returns the admin user
  });
});

app.get("/dealer-details/:dealerId", (req, res) => {
  const dealerId = req.params.dealerId;

  const summaryQuery = `
    SELECT 
      COUNT(*) AS total_orders,
      IFNULL(SUM(total), 0) AS total_sales,
      COUNT(DISTINCT shop_id) AS total_shops
    FROM orders
    WHERE dealer_id = ?
    AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = CURDATE()
  `;

  const shopWiseQuery = `
    SELECT 
      o.id AS shop_id,
      o.shop_name,
      o.shop_name_ta,
      DATE(CONVERT_TZ(or1.created_at, '+00:00', '+05:30')) AS last_order_date,
      COUNT(or1.id) AS total_bills,
      IFNULL(SUM(or1.total), 0) AS total_amount
    FROM orders or1
    JOIN outlets o ON o.id = or1.shop_id
    WHERE or1.dealer_id = ?
    GROUP BY 
      o.id, 
      o.shop_name, 
      o.shop_name_ta, 
      DATE(CONVERT_TZ(or1.created_at, '+00:00', '+05:30'))
    ORDER BY last_order_date DESC
  `;

  db.query(summaryQuery, [dealerId], (err, summary) => {
    if (err) return res.status(500).json({ message: "Summary error", err });

    db.query(shopWiseQuery, [dealerId], (err2, shops) => {
      if (err2) return res.status(500).json({ message: "Shop error", err2 });

      res.json({
        total_orders: summary[0]?.total_orders || 0,
        total_sales: summary[0]?.total_sales || 0,
        total_shops: summary[0]?.total_shops || 0,
        shops: shops || [],
      });
    });
  });
});
// ✅ APPROVE (mark as Paid)

app.put("/orders/:id/approve", (req, res) => {
  const { id } = req.params;
  const { adminNote = "" } = req.body;

  const findSql = `
    SELECT total, paid_amount, remaining_amount
    FROM orders
    WHERE id = ?
  `;

  db.query(findSql, [id], (err, rows) => {
    if (err) {
      console.error("ORDER LOOKUP ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch order",
      });
    }

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = rows[0];
    const total = Number(order.total);
    const paid = Number(order.paid_amount);
    const remaining = Number(order.remaining_amount);

    // Admin can approve only the amount actually verified.
    if (paid <= 0) {
      return res.status(400).json({
        success: false,
        message: "No payment has been recorded",
      });
    }

    const fullyPaid = paid >= total - 0.01 && remaining <= 0.01;

    const paymentStatus = fullyPaid
      ? "Paid"
      : "Partially Paid";

    const orderStatus = fullyPaid
      ? "APPROVED"
      : "PARTIALLY_PAID";

    const updateSql = `
      UPDATE orders
      SET payment_status = ?,
          order_status = ?,
          admin_note = ?,
          approved_at = NOW()
      WHERE id = ?
    `;

    db.query(
      updateSql,
      [paymentStatus, orderStatus, adminNote || null, id],
      (updateErr) => {
        if (updateErr) {
          console.error("APPROVAL ERROR:", updateErr);
          return res.status(500).json({
            success: false,
            message: "Failed to approve payment",
          });
        }

        return res.json({
          success: true,
          message: fullyPaid
            ? "Payment verified and order approved"
            : "Recorded payment verified. Balance is still pending",
          paymentStatus,
          orderStatus,
          remainingAmount: remaining,
        });
      }
    );
  });
});

app.put("/orders/:id/reject", (req, res) => {
  const { id } = req.params;
  const { adminNote = "" } = req.body;

  const sql = `
    UPDATE orders
    SET payment_status = 'Rejected',
        order_status = 'PAYMENT_REJECTED',
        admin_note = ?
    WHERE id = ?
      AND order_status != 'APPROVED'
  `;

  db.query(sql, [adminNote || "Payment needs verification", id], (err, result) => {
    if (err) {
      console.error("REJECT ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to reject payment",
      });
    }

    if (!result.affectedRows) {
      return res.status(400).json({
        success: false,
        message: "Order not found or already approved",
      });
    }

    return res.json({
      success: true,
      message: "Payment rejected. Please review the details.",
    });
  });
});

app.post("/api/auth/admin-reset-password", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const newPassword = String(req.body.newPassword || "");
  const resetKey = String(req.body.resetKey || "");

  if (
    email !== "rayesharayesha61@gmail.com" ||
    !process.env.ADMIN_RESET_KEY ||
    resetKey !== process.env.ADMIN_RESET_KEY
  ) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  db.query(
    "SELECT id FROM users WHERE LOWER(email) = ? AND LOWER(role) = 'admin' LIMIT 1",
    [email],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "Admin account not found",
        });
      }

      bcrypt.hash(newPassword, 12, (hashErr, hashedPassword) => {
        if (hashErr) {
          return res.status(500).json({
            success: false,
            message: "Password hashing failed",
          });
        }

        db.query(
          "UPDATE users SET password = ? WHERE id = ?",
          [hashedPassword, rows[0].id],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({
                success: false,
                message: "Password update failed",
              });
            }

            return res.json({
              success: true,
              message: "Admin password reset successfully",
            });
          }
        );
      });
    }
  );
});




const paymentUploadDir = path.join(__dirname, "uploads", "payment-qr");
fs.mkdirSync(paymentUploadDir, { recursive: true });

const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, paymentUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `qr-${Date.now()}${ext}`);
  },
});

const paymentUpload = multer({
  storage: paymentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("QR must be an image"));
    }
    cb(null, true);
  },
});

app.use(
  "/uploads/payment-qr",
  express.static(paymentUploadDir)
);

// Get actual dealers


// Get maximum 5 payment accounts


// Create or update account — QR image is optional




// Create or update a payment account.
// Supports JSON requests and multipart/form-data with optional QR image.
// ==========================================
// PAYMENT SETTINGS - CREATE / UPDATE
// ==========================================
// ==========================================
// GET PAYMENT ACCOUNT ASSIGNED TO A DEALER
// ==========================================
app.get("/api/dealer/pending-orders/:dealerId", async (req, res) => {
  try {
    const { dealerId } = req.params;

    const sql = `
      SELECT
        id,
        dealer_id,
        dealer_name,
        product_name,
        quantity,
        total_price,
        total,
        created_at,
        pending_due_date,
        payment_status,
        remaining_amount,
        GREATEST(
          TIMESTAMPDIFF(
            SECOND,
            NOW(),
            pending_due_date
          ),
          0
        ) AS seconds_left
      FROM orders
      WHERE dealer_id = ?
        AND remaining_amount > 0
        AND (
          payment_status IS NULL
          OR UPPER(payment_status) NOT IN ('PAID', 'CANCELLED')
        )
      ORDER BY pending_due_date ASC
    `;

    db.query(sql, [dealerId], (err, results) => {
      if (err) {
        console.error("Pending orders error:", err);
        return res.status(500).json({
          message: "Failed to fetch pending orders",
        });
      }

      const orders = results.map((order) => {
        const secondsLeft = Number(order.seconds_left || 0);

        return {
          ...order,
          seconds_left: secondsLeft,
          overdue: secondsLeft <= 0,
          days_left: Math.floor(secondsLeft / 86400),
          hours_left: Math.floor((secondsLeft % 86400) / 3600),
          minutes_left: Math.floor((secondsLeft % 3600) / 60),
        };
      });

      res.json(orders);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/payment-settings/dealer/:dealerId", (req, res) => {
  const dealerId = Number(req.params.dealerId);

  if (!Number.isInteger(dealerId) || dealerId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid dealer ID",
    });
  }

  const sql = `
    SELECT
      pa.id,
      pa.dealer_id,
      pa.payment_name,
      pa.phone,
      pa.upi_id,
      pa.payment_url,
      pa.qr_code,
      pa.status,
      u.name_en AS dealer_name
    FROM payment_accounts pa
    INNER JOIN users u ON u.id = pa.dealer_id
    WHERE pa.dealer_id = ?
      AND LOWER(TRIM(pa.status)) = 'active'
      AND LOWER(TRIM(u.role)) = 'dealer'
    ORDER BY pa.updated_at DESC, pa.id DESC
    LIMIT 1
  `;

  db.query(sql, [dealerId], (err, results) => {
    if (err) {
      console.error("Dealer payment account error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to load dealer payment details",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active payment account assigned to this dealer",
      });
    }

    return res.status(200).json({
      success: true,
      account: results[0],
    });
  });
});


// ==========================================
// UPDATE ORDER PAYMENT STATUS
// ==========================================

app.post("/api/payment/update", (req, res) => {
  const { orderId, paymentStatus, dealerId, paymentAccountId } = req.body;

  if (!orderId || !dealerId || !paymentAccountId) {
    return res.status(400).json({
      success: false,
      message: "Order ID, dealer ID and payment account ID are required",
    });
  }

  // IMPORTANT:
  // Change `orders`, `id`, `payment_status`, and `dealer_id`
  // below if your actual orders table uses different column names.
  const verifySql = `
    SELECT id
    FROM payment_accounts
    WHERE id = ?
      AND dealer_id = ?
      AND LOWER(TRIM(status)) = 'active'
    LIMIT 1
  `;

  db.query(
    verifySql,
    [paymentAccountId, dealerId],
    (verifyError, accountRows) => {
      if (verifyError) {
        console.error("Verify payment account error:", verifyError);

        return res.status(500).json({
          success: false,
          message: "Failed to verify payment account",
        });
      }

      if (accountRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Payment account does not belong to this dealer",
        });
      }

      // Do not trust the app's "I Paid" button as proof of payment.
      // This endpoint only records a pending verification request.
      if (paymentStatus !== "Paid") {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        });
      }

      return res.status(501).json({
        success: false,
        message:
          "Payment account verified. Implement order-table and payment-provider verification before marking this order as Paid.",
      });
    }
  );
});

app.post(
  "/api/payment-settings",
  paymentUpload.single("qrCode"),
  async (req, res) => {
    let uploadedFilePath = req.file?.path;

    try {
      const id = Number(req.body.id) || null;
      const dealerId = Number(req.body.dealerId || req.body.userId) || null;

      const paymentName = String(req.body.paymentName || "").trim();
      const phone = String(req.body.phone || "").trim();
      const upiId = String(req.body.upiId || "").trim();
      const paymentUrl = String(req.body.paymentUrl || "").trim();
      const status =
        req.body.status === "Inactive" ? "Inactive" : "Active";

      if (!dealerId || !paymentName || !phone || !upiId) {
        return res.status(400).json({
          success: false,
          message: "Dealer, payment name, phone and UPI ID are required",
        });
      }

      if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid 10-digit phone number",
        });
      }

      // Check selected dealer
      const [dealerRows] = await db.promise().query(
        `SELECT id FROM users
         WHERE id = ? AND LOWER(TRIM(role)) = 'dealer'`,
        [dealerId]
      );

      if (dealerRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid dealer selected",
        });
      }

      const qrPath = req.file
        ? `/uploads/payment-qr/${req.file.filename}`
        : null;

      // ==========================================
      // UPDATE EXISTING ACCOUNT
      // ==========================================

      if (id) {
        const [existingRows] = await db.promise().query(
          `SELECT id, qr_code
           FROM payment_accounts
           WHERE id = ?`,
          [id]
        );

        if (existingRows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Payment account not found",
          });
        }

        const oldQR = existingRows[0].qr_code;
        const finalQR = qrPath || oldQR;

        await db.promise().query(
          `UPDATE payment_accounts
           SET dealer_id = ?,
               payment_name = ?,
               phone = ?,
               upi_id = ?,
               payment_url = ?,
               status = ?,
               qr_code = ?
           WHERE id = ?`,
          [
            dealerId,
            paymentName,
            phone,
            upiId,
            paymentUrl || null,
            status,
            finalQR,
            id,
          ]
        );

        // Delete previous QR only after successful update
        if (qrPath && oldQR) {
          const oldFile = path.join(
            __dirname,
            "uploads",
            "payment-qr",
            path.basename(oldQR)
          );

          fs.unlink(oldFile, (err) => {
            if (err && err.code !== "ENOENT") {
              console.error("Old QR delete error:", err.message);
            }
          });
        }

        uploadedFilePath = null;

        return res.status(200).json({
          success: true,
          message: "Payment account updated successfully",
        });
      }

      // ==========================================
      // CREATE NEW ACCOUNT - MAXIMUM 5
      // ==========================================

      const [countRows] = await db.promise().query(
        "SELECT COUNT(*) AS total FROM payment_accounts"
      );

      if (Number(countRows[0].total) >= 5) {
        return res.status(400).json({
          success: false,
          message:
            "Only 5 payment accounts are allowed. Edit an existing account.",
        });
      }

      await db.promise().query(
        `INSERT INTO payment_accounts
          (dealer_id, payment_name, phone, upi_id, payment_url, status, qr_code)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          dealerId,
          paymentName,
          phone,
          upiId,
          paymentUrl || null,
          status,
          qrPath,
        ]
      );

      uploadedFilePath = null;

      return res.status(201).json({
        success: true,
        message: "Payment account saved successfully",
      });
    } catch (error) {
      console.error("Payment save error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to save payment account",
        error: error.message,
      });
    } finally {
      // Delete newly uploaded file if the save/update failed
      if (uploadedFilePath) {
        fs.unlink(uploadedFilePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("Uploaded QR cleanup error:", err.message);
          }
        });
      }
    }
  }
);

// ==========================================
// GET DEALERS FOR PAYMENT SETTINGS
// ==========================================

app.get("/api/payment-settings/dealers", (req, res) => {
  const sql = `
    SELECT id, name_en, email, phone, role
    FROM users
    WHERE LOWER(TRIM(role)) = 'dealer'
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Load dealers error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to load dealers",
      });
    }

    console.log("Dealers found:", results.length);

    return res.status(200).json({
      success: true,
      dealers: results,
    });
  });
});
app.get("/api/payment-settings/order/:orderId", (req, res) => {
  const orderId = Number(req.params.orderId);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  const sql = `
    SELECT
      pa.id,
      pa.dealer_id,
      pa.payment_name,
      pa.phone,
      pa.upi_id,
      pa.payment_url,
      pa.qr_code,
      o.id AS order_id,
      o.total AS order_total
    FROM orders o
    INNER JOIN payment_accounts pa
      ON pa.dealer_id = o.dealer_id
    INNER JOIN users u
      ON u.id = pa.dealer_id
    WHERE o.id = ?
      AND pa.status = 'Active'
      AND LOWER(TRIM(u.role)) = 'dealer'
    ORDER BY pa.updated_at DESC, pa.id DESC
    LIMIT 1
  `;

  db.query(sql, [orderId], (err, results) => {
    if (err) {
      console.error("Order payment account error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to load payment details",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "This order has no assigned dealer or active payment account.",
      });
    }

    return res.json({
      success: true,
      account: results[0],
    });
  });
});
// PRODUCT-WISE SALES / ORDER SUMMARY


/* TODAY'S SALES + DAILY SALES CHART */
app.get("/api/admin/daily-sales", (req, res) => {
  const sql = `
    SELECT
      DATE(created_at) AS sale_date,
      COALESCE(SUM(total), 0) AS sales,
      COUNT(*) AS order_count
    FROM orders
    WHERE created_at >= CURDATE() - INTERVAL 6 DAY
      AND created_at < CURDATE() + INTERVAL 1 DAY
    GROUP BY DATE(created_at)
    ORDER BY sale_date ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Daily sales error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to load daily sales",
      });
    }

    res.json({ success: true, data: rows });
  });
});
app.get("/api/admin/today-summary", (req, res) => {
  const sql = `
    SELECT
      COALESCE(SUM(total), 0) AS today_sales,
      COUNT(*) AS today_orders
    FROM orders
    WHERE created_at >= CURDATE()
      AND created_at < CURDATE() + INTERVAL 1 DAY
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Today's summary error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to load today's summary",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  });
});

/* TODAY'S PRODUCT SALES + BEST SELLER */
app.get("/api/admin/product-sales", (req, res) => {
  const sql = `
    SELECT items
    FROM orders
    WHERE created_at >= CURDATE()
      AND created_at < CURDATE() + INTERVAL 1 DAY
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Product sales error:", err);
      return res.status(500).json({
        success: false,
        message: "Unable to load product sales",
      });
    }

    const productMap = {};

    rows.forEach((order) => {
      try {
        const items =
          typeof order.items === "string"
            ? JSON.parse(order.items)
            : order.items;

        if (!Array.isArray(items)) return;

        items.forEach((item) => {
          const id = String(item.id);

          if (!productMap[id]) {
            productMap[id] = {
              product_id: item.id,
              product_name: item.name || `Product ${id}`,
              quantity_sold: 0,
              sales: 0,
            };
          }

          productMap[id].quantity_sold += Number(item.qty || 0);
          productMap[id].sales += Number(item.totalPrice || 0);
        });
      } catch (error) {
        console.error("Invalid order items:", error);
      }
    });

    res.json({
      success: true,
      data: Object.values(productMap).sort(
        (a, b) => b.quantity_sold - a.quantity_sold
      ),
    });
  });
});

// ==========================================
// GET ALL PAYMENT ACCOUNTS
// ==========================================

app.get("/api/payment-settings", (req, res) => {
  const sql = `
    SELECT
      pa.id,
      pa.dealer_id AS dealerId,
      pa.payment_name AS paymentName,
      pa.phone,
      pa.upi_id AS upiId,
      pa.payment_url AS paymentUrl,
      pa.qr_code AS qrCode,
      pa.status,
      u.name_en AS dealerName
    FROM payment_accounts pa
    LEFT JOIN users u ON u.id = pa.dealer_id
    ORDER BY pa.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Load payment accounts error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to load payment accounts",
      });
    }

    return res.status(200).json({
      success: true,
      accounts: results,
    });
  });
});
app.get("/api/admin/today-sales", (req, res) => {
  const sql = `
    SELECT
      COALESCE(SUM(total), 0) AS today_sales,
      COUNT(*) AS order_count
    FROM orders
    WHERE created_at >= CURDATE()
      AND created_at < CURDATE() + INTERVAL 1 DAY
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Today's sales error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch today's sales",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  });
});
// Create a new account or update an existing account


app.post("/api/auth/forgot-password", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  const sql = `
    SELECT id, email
    FROM users
    WHERE LOWER(email) = ?
      AND LOWER(role) = 'admin'
    LIMIT 1
  `;

  db.query(sql, [email], (err, users) => {
    if (err) {
      console.error("Forgot password error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "Admin email not found",
      });
    }

    const user = users[0];
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    db.query(
      `INSERT INTO password_reset_tokens
       (user_id, token_hash, expires_at, used_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), NULL)`,
      [user.id, otpHash],
      (insertErr) => {
        if (insertErr) {
          console.error("OTP save error:", insertErr.message);
          return res.status(500).json({
            success: false,
            message: "Could not create OTP",
          });
        }

        mailer.sendMail(
          {
            from: process.env.MAIL_USER,
            to: user.email,
            subject: "Spice App - Password Reset OTP",
            text: `Your OTP is ${otp}. It expires in 5 minutes. Do not share this OTP with anyone.`,
          },
          (mailErr) => {
            if (mailErr) {
              console.error("OTP email error:", mailErr.message);

              db.query(
                `UPDATE password_reset_tokens
                 SET used_at = NOW()
                 WHERE user_id = ?
                   AND token_hash = ?
                   AND used_at IS NULL`,
                [user.id, otpHash]
              );

              return res.status(500).json({
                success: false,
                message: "Could not send OTP email",
              });
            }

            return res.json({
              success: true,
              message: "OTP sent to your admin email",
            });
          }
        );
      }
    );
  });
});

// RESET PASSWORD API
app.post("/api/auth/reset-password", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();
  const newPassword = String(req.body.newPassword || "");

  if (!email || !/^\d{6}$/.test(otp) || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Enter valid OTP and password (minimum 8 characters)",
    });
  }

  const otpHash = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  const sql = `
    SELECT u.id, t.id AS tokenId
    FROM users u
    JOIN password_reset_tokens t ON t.user_id = u.id
    WHERE LOWER(u.email) = ?
      AND LOWER(u.role) = 'admin'
      AND t.token_hash = ?
      AND t.used_at IS NULL
      AND t.expires_at > NOW()
    ORDER BY t.id DESC
    LIMIT 1
  `;

  db.query(sql, [email, otpHash], (err, rows) => {
    if (err) {
      console.error("OTP verification error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    bcrypt.hash(newPassword, 12, (hashErr, hashedPassword) => {
      if (hashErr) {
        return res.status(500).json({
          success: false,
          message: "Password hashing failed",
        });
      }

      db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, rows[0].id],
        (updateErr) => {
          if (updateErr) {
            console.error("Password update error:", updateErr.message);
            return res.status(500).json({
              success: false,
              message: "Password update failed",
            });
          }

          db.query(
            `UPDATE password_reset_tokens
             SET used_at = NOW()
             WHERE user_id = ?
               AND used_at IS NULL`,
            [rows[0].id],
            (tokenErr) => {
              if (tokenErr) {
                console.error("OTP invalidation error:", tokenErr.message);
              }

              return res.json({
                success: true,
                message: "Password reset successfully. Please login.",
              });
            }
          );
        }
      );
    });
  });
});

// app.post("/api/forgot-password", (req, res) => {
//   const { email, role } = req.body;

//   if (!email || role !== "admin") {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid request.",
//     });
//   }

//   const sql = `
//     SELECT id, email, role
//     FROM users
//     WHERE LOWER(email) = LOWER(?)
//       AND LOWER(role) = 'admin'
//     LIMIT 1
//   `;

//   db.query(sql, [email.trim()], (err, results) => {
//     if (err) {
//       console.error("FORGOT PASSWORD ERROR:", err);
//       return res.status(500).json({
//         success: false,
//         message: "Server error.",
//       });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Admin account not found.",
//       });
//     }

//     // Admin verification succeeded.
//     // Add your secure password-reset process here.
//     return res.json({
//       success: true,
//       message: "Admin account verified. Continue with password reset.",
//     });
//   });
// });

// ❌ CANCEL (mark as Cancelled)
app.put("/orders/:id/cancel", (req, res) => {
  const { id } = req.params;

  const query = `
    UPDATE orders 
    SET payment_status = 'Cancelled' 
    WHERE id = ?
  `;

  db.query(query, [id], (err) => {
    if (err) return res.json({ success: false });

    res.json({ success: true });
  });
});





app.post("/create-order", async (req, res) => {
  let connection;

  try {
    const {
      shopId,
      dealerId,
      total,
      paymentMethod,
      items,
      gst,
      gpayAmount = 0,
      cashAmount = 0,
      gpayReference = "",
      paymentProof = "",
    } = req.body;

    const orderTotal = Number(total);
    const gpay = Number(gpayAmount);
    const cash = Number(cashAmount);
    const method = String(paymentMethod || "").toLowerCase();

    // 1. Validate order and payment
    if (
      !shopId ||
      !dealerId ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !Number.isFinite(orderTotal) ||
      orderTotal <= 0 ||
      !["cash", "gpay", "pending", "partial"].includes(method) ||
      !Number.isFinite(gpay) ||
      !Number.isFinite(cash) ||
      gpay < 0 ||
      cash < 0 ||
      gpay + cash > orderTotal + 0.01
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order or payment details",
      });
    }

    if (method === "gpay" && gpay <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter the GPay amount",
      });
    }

    if (method === "cash" && cash <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter the cash amount",
      });
    }

    if (method === "partial" && gpay + cash <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter at least one payment amount",
      });
    }

    // 2. Validate and combine product quantities
    const productQuantities = new Map();

    for (const item of items) {
      const productId = Number(item.id);
      const qty = Number(item.qty);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(qty) ||
        qty <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid product or quantity: ${
            item.name || "Product"
          }`,
        });
      }

      productQuantities.set(
        productId,
        (productQuantities.get(productId) || 0) + qty
      );
    }

    // 3. Begin transaction
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // 4. Check existing pending orders for this shop
    const [pendingRows] = await connection.execute(
      `SELECT COUNT(*) AS pendingCount
       FROM orders
       WHERE shop_id = ?
         AND payment_status = 'Pending'
         AND COALESCE(remaining_amount, 0) > 0`,
      [shopId]
    );

    if (
      Number(pendingRows[0].pendingCount) >= 2 &&
      method === "pending"
    ) {
      const error = new Error(
        "Two pending orders already exist. Please settle them first."
      );
      error.statusCode = 400;
      throw error;
    }

    // 5. Get dealer details
    const [dealers] = await connection.execute(
      `SELECT name_en, name_ta
       FROM users
       WHERE id = ?`,
      [dealerId]
    );

    if (dealers.length === 0) {
      const error = new Error("Dealer not found");
      error.statusCode = 400;
      throw error;
    }

    const dealer = dealers[0];

    // 6. Reduce stock safely
    for (const [productId, qty] of productQuantities.entries()) {
      const [stockResult] = await connection.execute(
        `UPDATE products
         SET stock_quantity = stock_quantity - ?
         WHERE id = ?
           AND stock_quantity >= ?`,
        [qty, productId, qty]
      );

      if (stockResult.affectedRows !== 1) {
        const error = new Error(
          `Product ID ${productId} is out of stock or has insufficient stock`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // 7. Calculate payment details
    const paid = Number((gpay + cash).toFixed(2));

    const remaining = Number(
      Math.max(0, orderTotal - paid).toFixed(2)
    );

    const paymentStatus =
      paid === 0 ? "Pending" : "Awaiting Approval";

    const orderStatus =
      paid >= orderTotal - 0.01
        ? "AWAITING_APPROVAL"
        : "PENDING";

    // Give each unpaid order a 15-day deadline
    const pendingDueDate =
      remaining > 0
        ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        : null;

    // 8. Save order, including its payment deadline
    const insertSql = `
      INSERT INTO orders (
        shop_id,
        dealer_id,
        dealer_name,
        total,
        payment_method,
        payment_status,
        items,
        gst,
        gpay_amount,
        cash_amount,
        paid_amount,
        remaining_amount,
        gpay_reference,
        payment_proof,
        order_status,
        pending_due_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      shopId,
      dealerId,
      dealer.name_ta || dealer.name_en || "Dealer",
      orderTotal,
      method,
      paymentStatus,
      JSON.stringify(items),
      Number(gst) || 0,
      gpay,
      cash,
      paid,
      remaining,
      gpayReference || null,
      paymentProof || null,
      orderStatus,
      pendingDueDate,
    ];

    const [orderResult] = await connection.execute(
      insertSql,
      values
    );

    // 9. Commit order and stock changes
    await connection.commit();

    return res.status(201).json({
      success: true,
      orderId: orderResult.insertId,
      total: orderTotal,
      gpayAmount: gpay,
      cashAmount: cash,
      paidAmount: paid,
      remainingAmount: remaining,
      pendingDueDate,
      paymentStatus,
      orderStatus,
      message:
        remaining > 0
          ? "Order saved with outstanding balance. Payment is due within 15 days."
          : "Order saved. Awaiting admin payment verification.",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("ORDER ROLLBACK ERROR:", rollbackError);
      }
    }

    console.error("CREATE ORDER ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to create order and update stock",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


app.post("/pay-single", async (req, res) => {
  let connection;

  try {
    const { orderId } = req.body;

    if (!orderId || !Number.isInteger(Number(orderId))) {
      return res.status(400).json({
        success: false,
        message: "Valid order ID is required",
      });
    }

    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    const [orders] = await connection.execute(
      `SELECT id, total, paid_amount, remaining_amount
       FROM orders
       WHERE id = ?
       FOR UPDATE`,
      [Number(orderId)]
    );

    if (orders.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orders[0];
    const remaining = Number(order.remaining_amount || 0);

    if (remaining <= 0) {
      await connection.rollback();

      return res.json({
        success: true,
        alreadyPaid: true,
        message: "Order is already settled",
      });
    }

    // IMPORTANT:
    // Call this route only after payment has been verified.
    const newPaidAmount = Number(
      (Number(order.paid_amount || 0) + remaining).toFixed(2)
    );

    await connection.execute(
      `UPDATE orders
       SET paid_amount = ?,
           remaining_amount = 0,
           payment_status = 'Paid',
           pending_due_date = NULL
       WHERE id = ?`,
      [newPaidAmount, Number(orderId)]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: "Payment verified and order settled",
      orderId: Number(orderId),
      remainingAmount: 0,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Payment rollback error:", rollbackError);
      }
    }

    console.error("PAY SINGLE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update payment",
    });
  } finally {
    if (connection) connection.release();
  }
});


// Get pending orders for a dealer

app.get("/dealer-pending-orders/:dealerId", async (req, res) => {
  try {
    const dealerId = Number(req.params.dealerId);

    const [orders] = await db.promise().execute(
      `SELECT id, shop_id, dealer_id, dealer_name, total,
              payment_status, paid_amount, remaining_amount,
              pending_due_date, order_status
       FROM orders
       WHERE dealer_id = ?
         AND COALESCE(remaining_amount, 0) > 0
       ORDER BY pending_due_date ASC, id DESC`,
      [dealerId]
    );

    const pendingAmount = orders.reduce(
      (sum, order) => sum + Number(order.remaining_amount || 0),
      0
    );

    res.json({
      success: true,
      orders,
      pendingAmount,
    });
  } catch (error) {
    console.error("FETCH PENDING ORDERS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending orders",
    });
  }
});


app.post("/api/pay-pending", async (req, res) => {
  try {
    const shopId = Number(req.body.shopId);

    if (!Number.isInteger(shopId) || shopId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid Shop ID is required",
      });
    }

    const [orders] = await db.promise().execute(
      `SELECT id, total, paid_amount, remaining_amount
       FROM orders
       WHERE shop_id = ?
         AND COALESCE(remaining_amount, 0) > 0
       ORDER BY id DESC`,
      [shopId]
    );

    if (orders.length === 0) {
      return res.json({
        success: true,
        orders: [],
        pendingAmount: 0,
        message: "No pending balance found",
      });
    }

    const pendingAmount = orders.reduce(
      (sum, order) =>
        sum + Number(order.remaining_amount || 0),
      0
    );

    return res.json({
      success: true,
      orders,
      pendingAmount,
      message:
        "Pending orders found. Complete and verify payment to clear the balance.",
    });
  } catch (error) {
    console.error("PAY PENDING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending orders",
    });
  }
});


app.post("/api/pay-single", async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    const orderId = Number(req.body.orderId);
    const method = String(req.body.method || "").toUpperCase();
    const cashAmount = Number(req.body.cashAmount || 0);
    const upiAmount = Number(req.body.upiAmount || 0);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid Order ID is required",
      });
    }

    if (!["CASH", "GPAY", "SPLIT"].includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Choose Cash, GPay or Split",
      });
    }

    if (
      !Number.isFinite(cashAmount) ||
      !Number.isFinite(upiAmount) ||
      cashAmount < 0 ||
      upiAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    // Do not mark GPay as paid before server-side verification.
    if (method === "GPAY" || (method === "SPLIT" && upiAmount > 0)) {
      return res.status(409).json({
        success: false,
        requiresUpiVerification: true,
        message:
          "UPI payment must be verified before the pending balance is updated.",
      });
    }

    if (method === "CASH" && cashAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid cash amount",
      });
    }

    if (method === "SPLIT" && (cashAmount <= 0 || upiAmount < 0)) {
      return res.status(400).json({
        success: false,
        message: "Enter valid Cash and GPay amounts",
      });
    }

    await connection.beginTransaction();

    const [orders] = await connection.execute(
      `SELECT id, shop_id, dealer_id, total,
              paid_amount, remaining_amount, payment_status
       FROM orders
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [orderId]
    );

    if (!orders.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orders[0];
    const remaining = Number(order.remaining_amount || 0);

    if (remaining <= 0) {
      await connection.rollback();
      return res.json({
        success: true,
        alreadyPaid: true,
        message: "No outstanding balance for this order",
      });
    }

    // This endpoint records cash only. Split payments with a UPI
    // portion need a separate verified-UPI callback/endpoint.
    if (method === "SPLIT") {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        requiresUpiVerification: true,
        message:
          "Record the cash portion first, then update the UPI portion after payment verification.",
      });
    }

    if (Math.round(cashAmount * 100) !== Math.round(remaining * 100)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Cash amount must equal the full outstanding balance for this endpoint.",
        remainingAmount: remaining,
      });
    }

    const newPaid = Number(order.paid_amount || 0) + cashAmount;

    await connection.execute(
      `UPDATE orders
       SET paid_amount = ?,
           remaining_amount = 0,
           payment_status = 'Paid'
       WHERE id = ?`,
      [newPaid, orderId]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: "Cash payment recorded successfully",
      orderId,
      paidAmount: newPaid,
      remainingAmount: 0,
      paymentStatus: "Paid",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}

    console.error("PAY SINGLE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to record payment",
    });
  } finally {
    connection.release();
  }
});




const regionMap = {
  chennai: "சென்னை",
  madurai: "மதுரை",
  ramnad: "ராமநாதபுரம்",
  karaikudi: "காரைக்குடி",
  thirunelveli: "திருநெல்வேலி",
};

app.post("/api/orders", async (req, res) => {
  const { items, total } = req.body;
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    for (const item of items) {
      const productId = Number(item.id);
      const qty = Number(item.qty);

      if (!productId || !Number.isInteger(qty) || qty <= 0) {
        throw new Error("Invalid product or quantity");
      }

      // Stock check and decrease in one query
      const [result] = await connection.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - ?
         WHERE id = ? AND stock_quantity >= ?`,
        [qty, productId, qty]
      );

      if (result.affectedRows === 0) {
        throw new Error(
          `${item.name || "Product"} is out of stock or has insufficient stock`
        );
      }
    }

    await connection.query(
      `INSERT INTO orders (items, total, created_at)
       VALUES (?, ?, NOW())`,
      [JSON.stringify(items), Number(total)]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Order placed and stock updated successfully",
    });
  } catch (error) {
    await connection.rollback();

    res.status(400).json({
      success: false,
      message: error.message || "Failed to place order",
    });
  } finally {
    connection.release();
  }
});
app.post("/create-outlet", async (req, res) => {
  try {
    const { shopName, region, phone, address, dealerId } = req.body;

    const shopName_ta = await translateToTamil(shopName);
    const address_ta = await translateToTamil(address);

    // ✅ IMPORTANT FIX
    const region_ta = regionMap[region] || region;

    const sql = `
      INSERT INTO outlets 
      (shop_name, shop_name_ta, region, region_ta, phone, address, address_ta, dealer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [shopName, shopName_ta, region, region_ta, phone, address, address_ta, dealerId],
      (err) => {
        if (err) return res.json({ success: false });

        res.json({ success: true });
      }
    );
  } catch (err) {
    res.json({ success: false });
  }
});
/* GET ALL OUTLETS */
app.get("/outlets", (req, res) => {
  db.query("SELECT * FROM outlets ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});

/* DELETE OUTLET */
app.delete("/delete-outlet/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM outlets WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  });
});
//  GET PROFILE BY ID

app.post("/api/upload-profile/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const image = req.file ? req.file.filename : null;

  if (!image) {
    return res.json({ success: false });
  }

  db.query(
    "UPDATE users SET image = ? WHERE id = ?",
    [image, id],
    (err) => {
      if (err) return res.status(500).json({ success: false });

      res.json({
        success: true,
        imageUrl: `${process.env.BASE_URL}/uploads/${image}`,
      });
    }
  );
});
app.get("/api/profile/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM users WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ success: false });

    if (result.length > 0) {
      const user = result[0];

      // ✅ Convert image filename → full URL
      user.image = user.image
        ? `${process.env.BASE_URL}/uploads/${user.image}`
        : null;

      res.json({
        success: true,
        user,
      });
    } else {
      res.json({ success: false });
    }
  });
});

app.get("/outlets", (req, res) => {
  db.query("SELECT * FROM outlets", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});


app.get("/api/dealer-sales/:id", (req, res) => {
  const dealerId = Number(req.params.id);

  if (!Number.isInteger(dealerId) || dealerId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid dealer ID is required",
    });
  }

  const sql = `
    SELECT COALESCE(SUM(total), 0) AS totalSales
    FROM orders
    WHERE dealer_id = ?
      AND created_at >= CURDATE()
      AND created_at < CURDATE() + INTERVAL 1 DAY
  `;

  db.query(sql, [dealerId], (err, result) => {
    if (err) {
      console.error("DEALER SALES ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch today's sales",
      });
    }

    return res.json({
      success: true,
      totalSales: Number(result[0].totalSales || 0),
    });
  });
});

app.get("/api/dealer-shops/:id", (req, res) => {
  const dealerId = req.params.id;

  const sql = `
    SELECT COUNT(DISTINCT shop_id) AS totalShops
    FROM orders
    WHERE dealer_id = ?
    AND DATE(created_at) = CURDATE()
  `;

  db.query(sql, [dealerId], (err, result) => {
    if (err) return res.status(500).json({ success: false });

    res.json({
      success: true,
      totalShops: result[0].totalShops || 0,
    });
  });
});

app.get("/db-test", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      console.log(err);
      return res.json({ ok: false });
    }
    res.json({ ok: true, message: "DB Working" });
  });
});
// app.listen(5000, "0.0.0.0", () => {
//   console.log("🚀 Server running on port 5000");
// });
// app.get("/api", (req, res) => {
//   res.send("API Working ✅");
// });
// app.get("/test-upload", (req, res) => {
//   res.send("uploads working");
// });
// app.get("/files", (req, res) => {
//   const files = fs.readdirSync(path.join(__dirname, "uploads"));
//   res.json(files);
// });
// const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port", PORT);

});



