let products = [];
let store = {};
let selectedProduct = null;
let selectedCategory = "الكل";


async function loadStore() {

    const response = await fetch("/api/store");

    store = await response.json();

    document.title = store.name;

    document.getElementById("storeName").textContent =
        store.name;

    document.getElementById("heroTitle").textContent =
        `أهلاً بكم في ${store.name} 👕`;

    document.getElementById("storeDescription").textContent =
        store.description;

    document.getElementById("storeAddress").textContent =
        `📍 ${store.address}`;

    document.getElementById("storePhone").textContent =
        `📞 ${store.phone}`;

    const logo = document.getElementById("storeLogo");

    if (store.logo) {
        logo.src = store.logo;
    } else {
        logo.style.display = "none";
    }

    const whatsapp = document.getElementById("whatsappButton");

    whatsapp.href =
        `https://wa.me/${store.whatsapp}`;
}


async function loadProducts() {

    const response = await fetch("/api/products");

    products = await response.json();

    createCategories();

    displayProducts();
}


function createCategories() {

    const categories = [
        "الكل",
        ...new Set(products.map(product => product.category))
    ];

    const container =
        document.getElementById("categories");

    container.innerHTML = "";

    categories.forEach(category => {

        const button =
            document.createElement("button");

        button.className = "category-btn";

        button.textContent = category;

        button.onclick = () => {

            selectedCategory = category;

            displayProducts();

        };

        container.appendChild(button);

    });
}


function displayProducts() {

    const container =
        document.getElementById("productsContainer");

    const search =
        document.getElementById("search").value
            .trim()
            .toLowerCase();

    let filtered = products.filter(product => {

        const matchesSearch =
            product.name.toLowerCase().includes(search);

        const matchesCategory =
            selectedCategory === "الكل" ||
            product.category === selectedCategory;

        return matchesSearch && matchesCategory;

    });

    container.innerHTML = "";

    if (filtered.length === 0) {

        container.innerHTML =
            "<p>لا توجد منتجات بهذا الاسم.</p>";

        return;
    }

    filtered.forEach(product => {

        const card =
            document.createElement("div");

        card.className = "product";

        const image =
            product.image ||
            "https://via.placeholder.com/500x500?text=Product";

        card.innerHTML = `

            <img src="${image}" alt="${product.name}">

            <div class="product-info">

                <h3>${product.name}</h3>

                <div class="price">
                    ${product.price} جنيه
                </div>

                <p>
                    ${product.category}
                </p>

                <button
                    class="order-button"
                    onclick="openOrder('${product.id}')"
                >
                    اطلب الآن
                </button>

            </div>
        `;

        container.appendChild(card);

    });
}


document
    .getElementById("search")
    .addEventListener("input", displayProducts);


function openOrder(productId) {

    selectedProduct =
        products.find(product => product.id === productId);

    if (!selectedProduct) return;

    document.getElementById("orderProductName")
        .textContent =
        `${selectedProduct.name} - ${selectedProduct.price} جنيه`;

    document.getElementById("orderModal")
        .style.display = "flex";
}


function closeOrder() {

    document.getElementById("orderModal")
        .style.display = "none";

}


document
    .getElementById("orderForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const order = {

            customerName:
                document.getElementById("customerName").value,

            phone:
                document.getElementById("customerPhone").value,

            address:
                document.getElementById("customerAddress").value,

            productName:
                selectedProduct.name,

            size:
                document.getElementById("orderSize").value,

            color:
                document.getElementById("orderColor").value,

            quantity:
                document.getElementById("orderQuantity").value
        };


        await fetch("/api/orders", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(order)

        });


        const message =
            `طلب جديد من ${store.name}

المنتج: ${selectedProduct.name}
السعر: ${selectedProduct.price} جنيه
المقاس: ${order.size}
اللون: ${order.color}
الكمية: ${order.quantity}

اسم العميل: ${order.customerName}
رقم الهاتف: ${order.phone}
العنوان: ${order.address}`;


        const whatsappURL =
            `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`;


        window.open(whatsappURL, "_blank");

        closeOrder();

        this.reset();

        alert("تم إرسال الطلب بنجاح ❤️");

    });


loadStore();
loadProducts();