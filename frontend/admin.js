let token = localStorage.getItem("adminToken");

const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");


// ==========================
// تشغيل لوحة التحكم
// ==========================

if (token) {
    showDashboard();
}


// ==========================
// تسجيل الدخول
// ==========================

async function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const message = document.getElementById("loginMessage");

    if (!username || !password) {
        message.textContent = "من فضلك اكتب اسم المستخدم وكلمة السر";
        return;
    }

    try {

        const response = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username,
                password
            })

        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "بيانات الدخول غير صحيحة";
            return;
        }

        token = data.token;

        localStorage.setItem("adminToken", token);

        showDashboard();

    } catch (error) {

        message.textContent = "حصل خطأ في الاتصال بالسيرفر";

        console.error(error);
    }
}


// ==========================
// إظهار لوحة التحكم
// ==========================

function showDashboard() {

    loginPage.classList.add("hidden");

    dashboard.classList.remove("hidden");

    loadStore();

    loadProducts();

    loadOrders();
}


// ==========================
// تسجيل الخروج
// ==========================

function logout() {

    localStorage.removeItem("adminToken");

    token = null;

    location.reload();
}


// ==========================
// جلب بيانات المحل
// ==========================

async function loadStore() {

    try {

        const response = await fetch("/api/store");

        const store = await response.json();

        document.getElementById("storeName").value =
            store.name || "";

        document.getElementById("storeWhatsapp").value =
            store.whatsapp || "";

        document.getElementById("storePhone").value =
            store.phone || "";

        document.getElementById("storeAddress").value =
            store.address || "";

        document.getElementById("storeDescription").value =
            store.description || "";

    } catch (error) {

        console.error(error);
    }
}


// ==========================
// حفظ بيانات المحل
// ==========================

async function saveStore() {

    const formData = new FormData();

    formData.append(
        "name",
        document.getElementById("storeName").value
    );

    formData.append(
        "whatsapp",
        document.getElementById("storeWhatsapp").value
    );

    formData.append(
        "phone",
        document.getElementById("storePhone").value
    );

    formData.append(
        "address",
        document.getElementById("storeAddress").value
    );

    formData.append(
        "description",
        document.getElementById("storeDescription").value
    );

    const logo =
        document.getElementById("storeLogo").files[0];

    if (logo) {
        formData.append("logo", logo);
    }

    try {

        const response = await fetch("/api/store", {

            method: "PUT",

            headers: {
                Authorization: `Bearer ${token}`
            },

            body: formData

        });

        const data = await response.json();

        if (response.ok) {

            document.getElementById("storeMessage").textContent =
                "✅ تم حفظ بيانات المحل";

        } else {

            document.getElementById("storeMessage").textContent =
                data.message || "حدث خطأ";

        }

    } catch (error) {

        console.error(error);

        document.getElementById("storeMessage").textContent =
            "حدث خطأ في الاتصال";
    }
}


// ==========================
// إضافة منتج
// ==========================

async function addProduct() {

    const name =
        document.getElementById("productName").value;

    const price =
        document.getElementById("productPrice").value;

    const category =
        document.getElementById("productCategory").value;

    const sizes =
        document.getElementById("productSizes").value;

    const colors =
        document.getElementById("productColors").value;

    const description =
        document.getElementById("productDescription").value;

    const image =
        document.getElementById("productImage").files[0];


    if (!name || !price || !image) {

        document.getElementById("productMessage").textContent =
            "⚠️ لازم تكتب اسم المنتج والسعر وتختار صورة";

        return;
    }


    const formData = new FormData();

    formData.append("name", name);

    formData.append("price", price);

    formData.append("category", category);

    formData.append(
        "sizes",
        JSON.stringify(
            sizes
                .split(",")
                .map(x => x.trim())
                .filter(Boolean)
        )
    );

    formData.append(
        "colors",
        JSON.stringify(
            colors
                .split(",")
                .map(x => x.trim())
                .filter(Boolean)
        )
    );

    formData.append("description", description);

    formData.append("image", image);


    try {

        const response = await fetch("/api/products", {

            method: "POST",

            headers: {
                Authorization: `Bearer ${token}`
            },

            body: formData

        });


        const data = await response.json();


        if (!response.ok) {

            document.getElementById("productMessage").textContent =
                data.message || "حدث خطأ";

            return;
        }


        document.getElementById("productMessage").textContent =
            "✅ تم إضافة المنتج";


        document.getElementById("productName").value = "";

        document.getElementById("productPrice").value = "";

        document.getElementById("productSizes").value = "";

        document.getElementById("productColors").value = "";

        document.getElementById("productDescription").value = "";

        document.getElementById("productImage").value = "";


        loadProducts();


    } catch (error) {

        console.error(error);

        document.getElementById("productMessage").textContent =
            "حدث خطأ في الاتصال";
    }
}


// ==========================
// تحميل المنتجات
// ==========================

async function loadProducts() {

    try {

        const response =
            await fetch("/api/products");

        const products =
            await response.json();


        const container =
            document.getElementById("productsList");


        if (!products.length) {

            container.innerHTML =
                "<p>لا توجد منتجات حتى الآن.</p>";

            return;
        }


        container.innerHTML = "";


        products.forEach(product => {

            const image =
                product.image
                    ? product.image
                    : "";


            const div =
                document.createElement("div");

            div.className =
                "product-admin";


            div.innerHTML = `

                ${image
                    ? `<img src="${image}" alt="">`
                    : ""
                }

                <div class="product-admin-content">

                    <h3>${escapeHtml(product.name)}</h3>

                    <p>السعر: ${product.price} جنيه</p>

                    <p>القسم: ${escapeHtml(product.category || "")}</p>

                    <p>
                        المقاسات:
                        ${Array.isArray(product.sizes)
                    ? product.sizes.join(" - ")
                    : ""}
                    </p>

                    <p>
                        الألوان:
                        ${Array.isArray(product.colors)
                    ? product.colors.join(" - ")
                    : ""}
                    </p>

                    <button
                        class="delete-btn"
                        onclick="deleteProduct('${product.id}')">
                        🗑️ حذف المنتج
                    </button>

                </div>
            `;


            container.appendChild(div);

        });


    } catch (error) {

        console.error(error);

        document.getElementById("productsList").innerHTML =
            "<p>حصل خطأ في تحميل المنتجات.</p>";
    }
}


// ==========================
// حذف منتج
// ==========================

async function deleteProduct(id) {

    const confirmDelete =
        confirm("هل أنت متأكد من حذف المنتج؟");


    if (!confirmDelete) return;


    try {

        const response =
            await fetch(`/api/products/${id}`, {

                method: "DELETE",

                headers: {
                    Authorization: `Bearer ${token}`
                }

            });


        if (response.ok) {

            loadProducts();

        } else {

            const data =
                await response.json();

            alert(data.message || "حدث خطأ");
        }


    } catch (error) {

        console.error(error);

        alert("حدث خطأ في الاتصال");
    }
}


// ==========================
// تحميل الطلبات
// ==========================

async function loadOrders() {

    try {

        const response =
            await fetch("/api/orders", {

                headers: {
                    Authorization: `Bearer ${token}`
                }

            });


        if (!response.ok) {

            document.getElementById("ordersList").innerHTML =
                "<p>لا يمكن تحميل الطلبات.</p>";

            return;
        }


        const orders =
            await response.json();


        const container =
            document.getElementById("ordersList");


        if (!orders.length) {

            container.innerHTML =
                "<p>لا توجد طلبات حتى الآن.</p>";

            return;
        }


        container.innerHTML = "";


        orders.reverse().forEach(order => {

            const div =
                document.createElement("div");

            div.className =
                "order";


            div.innerHTML = `

                <h3>
                    📦 طلب رقم:
                    ${escapeHtml(String(order.id))}
                </h3>

                <p>
                    <strong>العميل:</strong>
                    ${escapeHtml(order.customerName || "")}
                </p>

                <p>
                    <strong>الهاتف:</strong>
                    ${escapeHtml(order.phone || "")}
                </p>

                <p>
                    <strong>العنوان:</strong>
                    ${escapeHtml(order.address || "")}
                </p>

                <p>
                    <strong>المنتج:</strong>
                    ${escapeHtml(order.productName || "")}
                </p>

                <p>
                    <strong>المقاس:</strong>
                    ${escapeHtml(order.size || "")}
                </p>

                <p>
                    <strong>اللون:</strong>
                    ${escapeHtml(order.color || "")}
                </p>

                <p>
                    <strong>الكمية:</strong>
                    ${escapeHtml(String(order.quantity || ""))}
                </p>

                <p class="status">
                    الحالة:
                    ${escapeHtml(order.status || "جديد")}
                </p>

                <div class="order-buttons">

                    <button
                        class="prepare"
                        onclick="updateOrder('${order.id}', 'تم التجهيز')">
                        تم التجهيز
                    </button>

                    <button
                        class="delivered"
                        onclick="updateOrder('${order.id}', 'تم التسليم')">
                        تم التسليم
                    </button>

                </div>

            `;


            container.appendChild(div);

        });


    } catch (error) {

        console.error(error);

        document.getElementById("ordersList").innerHTML =
            "<p>حدث خطأ في تحميل الطلبات.</p>";
    }
}


// ==========================
// تغيير حالة الطلب
// ==========================

async function updateOrder(id, status) {

    try {

        const response =
            await fetch(`/api/orders/${id}`, {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json",

                    Authorization: `Bearer ${token}`

                },

                body: JSON.stringify({
                    status
                })

            });


        if (response.ok) {

            loadOrders();

        } else {

            const data =
                await response.json();

            alert(data.message || "حدث خطأ");
        }


    } catch (error) {

        console.error(error);

        alert("حدث خطأ في الاتصال");
    }
}


// ==========================
// حماية من إدخال HTML
// ==========================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}