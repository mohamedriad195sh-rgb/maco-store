const express = require("express");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const UPLOADS_DIR = path.join(ROOT, "uploads");

const STORE_FILE = path.join(DATA_DIR, "store.json");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

const JWT_SECRET =
    process.env.JWT_SECRET || "CHANGE_THIS_SECRET_123";

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.static(path.join(ROOT, "frontend")));

function ensureFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    if (!fs.existsSync(STORE_FILE)) {
        fs.writeFileSync(
            STORE_FILE,
            JSON.stringify(
                {
                    name: "اسم المحل",
                    logo: "",
                    whatsapp: "201000000000",
                    phone: "",
                    address: "عنوان المحل",
                    description: "أهلاً بكم في متجرنا"
                },
                null,
                2
            )
        );
    }

    if (!fs.existsSync(PRODUCTS_FILE)) {
        fs.writeFileSync(PRODUCTS_FILE, "[]");
    }

    if (!fs.existsSync(ORDERS_FILE)) {
        fs.writeFileSync(ORDERS_FILE, "[]");
    }
}

ensureFiles();

function readJSON(file) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2)
    );
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);

        const name =
            Date.now() +
            "-" +
            Math.round(Math.random() * 100000);

        cb(null, name + ext);
    }
});

const upload = multer({
    storage
});

function auth(req, res, next) {
    const header = req.headers.authorization;

    if (
        !header ||
        !header.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            message: "غير مصرح"
        });
    }

    const token = header.split(" ")[1];

    try {
        req.user = jwt.verify(
            token,
            JWT_SECRET
        );

        next();
    } catch {
        return res.status(401).json({
            message: "الجلسة انتهت"
        });
    }
}

/* =========================
   STORE
========================= */

app.get("/api/store", (req, res) => {
    res.json(readJSON(STORE_FILE));
});

app.put(
    "/api/store",
    auth,
    upload.single("logo"),
    (req, res) => {
        const store = readJSON(STORE_FILE);

        store.name =
            req.body.name || store.name;

        store.whatsapp =
            req.body.whatsapp || "";

        store.phone =
            req.body.phone || "";

        store.address =
            req.body.address || "";

        store.description =
            req.body.description || "";

        if (req.file) {
            store.logo =
                "/uploads/" +
                req.file.filename;
        }

        writeJSON(STORE_FILE, store);

        res.json(store);
    }
);

/* =========================
   PRODUCTS
========================= */

app.get("/api/products", (req, res) => {
    res.json(readJSON(PRODUCTS_FILE));
});

app.post(
    "/api/products",
    auth,
    upload.single("image"),
    (req, res) => {
        const products =
            readJSON(PRODUCTS_FILE);

        const product = {
            id: Date.now().toString(),

            name: req.body.name,

            price: Number(
                req.body.price || 0
            ),

            category:
                req.body.category || "أخرى",

            sizes:
                req.body.sizes || "",

            colors:
                req.body.colors || "",

            description:
                req.body.description || "",

            image: req.file
                ? "/uploads/" +
                req.file.filename
                : ""
        };

        products.push(product);

        writeJSON(
            PRODUCTS_FILE,
            products
        );

        res.json(product);
    }
);

app.put(
    "/api/products/:id",
    auth,
    upload.single("image"),
    (req, res) => {
        const products =
            readJSON(PRODUCTS_FILE);

        const index =
            products.findIndex(
                product =>
                    product.id ===
                    req.params.id
            );

        if (index === -1) {
            return res.status(404).json({
                message:
                    "المنتج غير موجود"
            });
        }

        products[index].name =
            req.body.name;

        products[index].price =
            Number(
                req.body.price || 0
            );

        products[index].category =
            req.body.category ||
            "أخرى";

        products[index].sizes =
            req.body.sizes || "";

        products[index].colors =
            req.body.colors || "";

        products[index].description =
            req.body.description || "";

        if (req.file) {
            products[index].image =
                "/uploads/" +
                req.file.filename;
        }

        writeJSON(
            PRODUCTS_FILE,
            products
        );

        res.json(products[index]);
    }
);

app.delete(
    "/api/products/:id",
    auth,
    (req, res) => {
        let products =
            readJSON(PRODUCTS_FILE);

        products =
            products.filter(
                product =>
                    product.id !==
                    req.params.id
            );

        writeJSON(
            PRODUCTS_FILE,
            products
        );

        res.json({
            message:
                "تم حذف المنتج"
        });
    }
);

/* =========================
   ORDERS
========================= */

app.get(
    "/api/orders",
    auth,
    (req, res) => {
        res.json(
            readJSON(ORDERS_FILE)
        );
    }
);

app.post(
    "/api/orders",
    (req, res) => {
        const orders =
            readJSON(ORDERS_FILE);

        const order = {
            id: Date.now().toString(),

            customerName:
                req.body.customerName,

            phone:
                req.body.phone,

            address:
                req.body.address,

            productName:
                req.body.productName,

            size:
                req.body.size,

            color:
                req.body.color,

            quantity:
                Number(
                    req.body.quantity || 1
                ),

            createdAt:
                new Date().toISOString(),

            status: "جديد"
        };

        orders.push(order);

        writeJSON(
            ORDERS_FILE,
            orders
        );

        res.json(order);
    }
);

app.put(
    "/api/orders/:id",
    auth,
    (req, res) => {
        const orders =
            readJSON(ORDERS_FILE);

        const order =
            orders.find(
                order =>
                    order.id ===
                    req.params.id
            );

        if (!order) {
            return res.status(404).json({
                message:
                    "الأوردر غير موجود"
            });
        }

        order.status =
            req.body.status ||
            order.status;

        writeJSON(
            ORDERS_FILE,
            orders
        );

        res.json(order);
    }
);

/* =========================
   LOGIN
========================= */

app.post(
    "/api/login",
    async (req, res) => {
        const {
            username,
            password
        } = req.body;

        const correctUsername =
            process.env.ADMIN_USERNAME ||
            "admin";

        const correctPassword =
            process.env.ADMIN_PASSWORD ||
            "123456";

        if (
            username !==
            correctUsername ||
            password !==
            correctPassword
        ) {
            return res.status(401).json({
                message:
                    "اسم المستخدم أو كلمة السر غير صحيحة"
            });
        }

        const token =
            jwt.sign(
                { username },
                JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

        res.json({
            token
        });
    }
);

/* =========================
   FRONTEND
========================= */

/*
   Express 5 لا يقبل app.get("*")
   لذلك نستخدم الصيغة الجديدة:
*/

app.get(
    "/{*splat}",
    (req, res) => {
        res.sendFile(
            path.join(
                ROOT,
                "frontend",
                "index.html"
            )
        );
    }
);

/* =========================
   START SERVER
========================= */

app.listen(
    PORT,
    () => {
        console.log(
            `Store running on http://localhost:${PORT}`
        );
    }
);