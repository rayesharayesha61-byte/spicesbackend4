
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const axios = require("axios");

async function translateToTamil(text) {
  const res = await axios.get(
    `https://api.mymemory.translated.net/get?q=${text}&langpair=en|ta`
  );

  return res.data.responseData.translatedText;
}
//  Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

//  Create uploads folder
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

//  DB Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "rayesha",
  database: "spicedb",
});

db.connect((err) => {
  if (err) {
    console.log("DB Connection Error:", err);
    return;
  }
  console.log(" MySQL Connected");
});

// Multer (Image Upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Missing fields",
    });
  }

  const query = `
    SELECT 
      id,
      name_en,
      name_ta,
      email,
      role,
      phone
    FROM users 
    WHERE email=? AND password=?
  `;

  db.query(query, [email.trim(), password.trim()], (err, results) => {
    if (err) {
      console.log("DB Error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }

    if (results.length > 0) {
      const user = results[0];

      return res.json({
        success: true,
        user: user,
      });
    } else {
      return res.json({
        success: false,
        message: "Invalid credentials",
      });
    }
  });
});


app.post("/api/create-dealer", upload.single("image"), async (req, res) => {
  try {
    let { name_en, name_ta, location, phone, aadhar } = req.body;

    const image = req.file ? req.file.filename : null;

    if (!name_en && !name_ta) {
      return res.json({ success: false, message: "Name required" });
    }

    if (!location) {
      return res.json({ success: false, message: "Location required" });
    }

    let location_en = location;
    let location_ta = await translateToTamil(location);

    if (!name_en) name_en = name_ta;
    if (!name_ta) name_ta = name_en;

    const dealerId = "D" + Date.now();
    const password = Math.random().toString(36).slice(-8);

    // ✅ FIRST CHECK COUNT
    db.query(
      "SELECT COUNT(*) as total FROM users WHERE role='dealer'",
      (err, result) => {
        if (err) {
          return res.status(500).json({ success: false });
        }

        if (result[0].total >= 5) {
          return res.json({
            success: false,
            message: "Only 5 dealers allowed",
          });
        }

        // ✅ INSERT ONLY IF < 5
        const query = `
          INSERT INTO users 
          (name_en, name_ta, email, password, role, phone, aadhar, location_en, location_ta, image)
          VALUES (?, ?, ?, ?, 'dealer', ?, ?, ?, ?, ?)
        `;

        db.query(
          query,
          [
            name_en,
            name_ta,
            dealerId,
            password,
            phone,
            aadhar,
            location_en,
            location_ta,
            image,
          ],
          (err) => {
            if (err) {
              console.log("INSERT ERROR:", err);
              return res.status(500).json({ success: false });
            }

            return res.json({
              success: true,
              dealerId,
              password,
            });
          }
        );
      }
    );
  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({ success: false });
  }
});

app.post("/api/products", upload.single("image"), (req, res) => {
  const { name, name_ta, description, price, origin, classType } = req.body;

  const image = req.file ? req.file.filename : null;

  if (!name || !price) {
    return res.json({
      success: false,
      message: "Name and price required",
    });
  }

  const query = `
    INSERT INTO products 
    (name, name_ta, description, price, origin, class_type, image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      name,
      name_ta || null, // ✅ important
      description,
      Number(price),
      origin,
      classType,
      image,
    ],
    (err) => {
      if (err) {
        console.log("Insert Error:", err);
        return res.status(500).json({ success: false });
      }

      res.json({
        success: true,
        message: "Product added",
      });
    }
  );
});
/* =========================================
    GET PRODUCTS 
========================================= */
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) return res.status(500).json({ success: false });

    // ✅ Add full image URL
    const updated = result.map((item) => ({
      ...item,
      image: item.image
        ? `http://192.168.29.155:5000/uploads/${item.image}`
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
        return res.status(500).json({ success: false });
      }

      const formatted = result.map((d) => ({
        id: d.id,
        name: lang === "ta" ? d.name_ta : d.name_en,
        location: lang === "ta" ? d.location_ta : d.location_en,
        phone: d.phone,
      }));

      return res.json(formatted); // ✅ single response
    });
  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({ success: false });
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
app.put("/products/:id", (req, res) => {
  const { name, price } = req.body;
  const { id } = req.params;

  db.query(
    "UPDATE products SET name=?, price=? WHERE id=?",
    [name, price, id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Updated successfully" });
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

  const query = `
    UPDATE orders 
    SET payment_status = 'Paid' 
    WHERE id = ?
  `;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.log("APPROVE ERROR 👉", err); // 🔥 PRINT REAL ERROR
      return res.json({ success: false, error: err.message });
    }

    console.log("RESULT 👉", result); // 🔥 DEBUG

    res.json({ success: true });
  });
});


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



app.post("/create-order", (req, res) => {
  console.log("BODY 👉", req.body);

  const {
    shopId,
    dealerId,
    total,
    paymentMethod,
    items,
    gst,
  } = req.body;

  console.log("ITEMS 👉", items);

  // 🔍 Check pending count
  const checkSql = `
    SELECT COUNT(*) as pendingCount
    FROM orders
    WHERE shop_id = ? AND payment_status = 'Pending'
  `;

  db.query(checkSql, [shopId], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    const pendingCount = result[0].pendingCount;

    // ❌ Block after 2 pending orders
    if (pendingCount >= 2 && paymentMethod === "pending") {

      const pendingSql = `
        SELECT *
        FROM orders
        WHERE shop_id = ? AND payment_status = 'Pending'
      `;

      db.query(pendingSql, [shopId], (err2, orders) => {
        if (err2) {
          console.log(err2);
          return res.json({ success: false });
        }

        const totalPending = orders.reduce(
          (sum, o) => sum + Number(o.total),
          0
        );

        return res.json({
          success: false,
          message: "⚠️ 2 Pending reached. Pay previous orders",
          pendingOrders: orders,
          pendingAmount: totalPending,
        });
      });

      return;
    }

    // ✅ Payment status
    const status =
      paymentMethod === "pending"
        ? "Pending"
        : "Paid";

    // ✅ Fetch dealer name
    db.query(
      "SELECT name_en, name_ta FROM users WHERE id = ?",
      [dealerId],
      (err2, dealerResult) => {

        if (err2) {
          console.log(err2);
          return res.json({ success: false });
        }

        const dealer =
          dealerResult.length > 0
            ? dealerResult[0]
            : null;

        console.log("DEALER 👉", dealer);

        // ✅ Insert order
        const insertSql = `
          INSERT INTO orders
          (
            shop_id,
            dealer_id,
            dealer_name,
            total,
            payment_method,
            payment_status,
            items,
            gst
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

       db.query(
  insertSql,
  [
    shopId,
    dealerId,

    dealer?.name_ta ||
    dealer?.name_en ||
    "Dealer User",

    total,
    paymentMethod,
    status,
    JSON.stringify(items),
    gst,
  ],
  (err3, result3) => {

    if (err3) {
      console.log(err3);
      return res.json({ success: false });
    }

    return res.json({
      success: true,
      orderId: result3.insertId,
      dealer: dealer,
    });
  }
);
      }
    );
  });
});
app.post("/api/pay-pending", (req, res) => {
  const { shopId } = req.body;

  const sql = `
    UPDATE orders 
    SET payment_status = 'Paid' 
    WHERE shop_id = ? AND payment_status = 'Pending'
  `;

  db.query(sql, [shopId], (err) => {
    if (err) return res.json({ success: false });

    res.json({ success: true });
  });
});
app.post("/api/pay-single", (req, res) => {
  const { orderId } = req.body;

  const sql = "UPDATE orders SET payment_status='Paid' WHERE id=?";

  db.query(sql, [orderId], (err) => {
    if (err) {
      return res.json({ success: false });
    }

    res.json({ success: true });
  });
});


const regionMap = {
  chennai: "சென்னை",
  madurai: "மதுரை",
  ramnad: "ராமநாதபுரம்",
  karaikudi: "காரைக்குடி",
  thirunelveli: "திருநெல்வேலி",
};


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
        imageUrl: `http://192.168.29.155:5000/uploads/${image}`,
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
        ? `http://192.168.29.155:5000/uploads/${user.image}`
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
  const dealerId = req.params.id;

  const sql = `
    SELECT SUM(total) AS totalSales
    FROM orders
    WHERE dealer_id = ?
    AND DATE(created_at) = CURDATE()
  `;

  db.query(sql, [dealerId], (err, result) => {
    if (err) return res.status(500).json({ success: false });

    res.json({
      success: true,
      totalSales: result[0].totalSales || 0,
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


// app.listen(5000, "0.0.0.0", () => {
//   console.log("🚀 Server running on port 5000");
// });
app.get("/api", (req, res) => {
  res.send("API Working ✅");
});

app.listen(5000, "0.0.0.0", () => {
  console.log("🚀 Server running on port 5000");
});