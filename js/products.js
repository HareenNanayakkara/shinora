fetch("../data/products.json")
  .then((res) => res.json())
  .then((data) => {
    const container = document.getElementById("product-container");
    const category = "shower-screens"; // You can change for mirrors.html, wardrobes.html

    data[category].forEach((item) => {
      container.innerHTML += `
        <div class="col-lg-4 col-md-6">
          <div class="de-room">
            <div class="d-image">
              <div class="d-label">New Product</div>
              <div class="d-details">
                <span><img src="../images/ui/user.svg"> ${item.details.finish}</span>
                <span><img src="../images/ui/floorplan.svg"> ${item.details.size}</span>
              </div>
              <a href="product-single.html?id=${item.id}&cat=${category}">
                <img src="../${item.image}" class="img-fluid" alt="">
                <img src="../${item.imageAlt}" class="d-img-hover img-fluid" alt="">
              </a>
            </div>
            <div class="d-text">
              <h3>${item.name}</h3>
              <p>${item.description}</p>
              <a href="product-single.html?id=${item.id}&cat=${category}" class="btn-line">
                <span>View Product</span>
              </a>
            </div>
          </div>
        </div>
      `;
    });
  });
