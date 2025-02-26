document.addEventListener("DOMContentLoaded", () => {
    initIntersectionObserver();
    

});

function initIntersectionObserver() {
    // Select all sections and navigation links
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-link");

    // Options for the IntersectionObserver
    const observerOptions = {
        root: null, // Use the viewport as the root
        threshold: 0.2, // Trigger when 20% of the section is visible
    };

    // Create the IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Remove the 'active' class from all navigation links
                navLinks.forEach((link) => link.classList.remove("active"));

                // Find the navigation link that corresponds to the visible section
                const activeLink = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
                if (activeLink) {
                    // Add the 'active' class to the corresponding link
                    activeLink.classList.add("active");
                }
            }
        });
    }, observerOptions);

    // Observe all sections
    sections.forEach((section) => observer.observe(section));
}
function toggleMenu() {
    const nav = document.querySelector("nav ul");
    nav.classList.toggle("show");
}
document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll("nav ul li a");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    navLinks.forEach((link) => {
                        link.classList.remove("active");
                        if (link.getAttribute("href").substring(1) === entry.target.id) {
                            link.classList.add("active");
                        }
                    });
                }
            });
        },
        { threshold: 0.4 }
    );

    sections.forEach((section) => observer.observe(section));
});


let cart = [];
let favorites = [];

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartElement = document.getElementById('cart'); // Get the cart element

    if (cartItems) {
        // Update the cart items display
        if (cart.length > 0) {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <span>${item.name}</span>
                    <span>${item.price}</span>
                </div>
            `).join('');
        } else {
            // Display a message when the cart is empty
            cartItems.innerHTML = `<div class="empty-cart-message">Your cart is empty.</div>`;
        }

        // Update the cart total (if needed)
        const cartTotal = document.getElementById('cart-total');
        if (cartTotal) {
            const total = cart.reduce((sum, item) => sum + parseFloat(item.price.replace('Rs.', '')), 0);
            cartTotal.textContent = `Total: Rs.${total.toFixed(2)}`;
        }

        // Always show the cart, regardless of whether it has items
        cartElement.classList.add('visible');
    }
}
function updateFavoritesDisplay() {
    const favoritesList = document.getElementById('favorites-list');
    if (favoritesList) {
        favoritesList.innerHTML = favorites.map(item => `
            <div class="favorite-item">
                <span>${item}</span>
            </div>
        `).join('');
    }
}
function initializeEventListeners() {
    // Reinitialize filter functionality
    const filterLinks = document.querySelectorAll('.filter-link');
    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category').toLowerCase();

            // Remove active class from all links
            filterLinks.forEach(lnk => lnk.classList.remove('active'));
            // Add active class to the clicked link
            link.classList.add('active');

            // Hide the welcome message
            const welcomeMessage = document.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.style.display = 'none';
            }

            // Filter menu items within the selected category
            const menuItems = document.querySelectorAll('.menu-card');
            menuItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category').toLowerCase();
                if (category === 'all' || itemCategory === category) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Reinitialize search functionality
    const searchBar = document.getElementById('search');
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            const searchTerm = searchBar.value.toLowerCase();
            const menuItems = document.querySelectorAll('.menu-card');
            menuItems.forEach(item => {
                const itemName = item.querySelector('h4').textContent.toLowerCase();
                if (itemName.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Reinitialize add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemName = button.parentElement.querySelector('h4').textContent;
            const itemPrice = button.parentElement.querySelector('span').textContent;
            cart.push({ name: itemName, price: itemPrice });
            updateCartDisplay();
            alert(`Added ${itemName} (${itemPrice}) to cart!`);
        });
    });
}

const clearCartButton = document.getElementById('clear-cart');
if (clearCartButton) {
    console.log('Clear Cart button found'); // Debugging line
    clearCartButton.addEventListener('click', () => {
        console.log('Clear Cart button clicked'); // Debugging line
        console.log('Cart before clearing:', cart); // Debugging line

        // Clear the cart array
        cart = [];

        console.log('Cart after clearing:', cart); // Debugging line

        // Update the cart display
        updateCartDisplay();

        alert('Cart cleared!');
    });
} else {
    console.error('Clear Cart button not found'); // Debugging line
}
document.addEventListener('DOMContentLoaded', function () {
    const menuCategories = document.getElementById('menu-categories');

    // Fetch menu items from the server
    fetch('/api/menu')
        .then(response => response.json())
        .then(data => {
            // Loop through each category
            for (const [category, subcategories] of Object.entries(data)) {
                // Loop through each subcategory
                for (const [subcategory, items] of Object.entries(subcategories)) {
                    // Create a container for the subcategory group
                    const subcategoryGroup = document.createElement('div');
                    subcategoryGroup.classList.add('subcategory-group');
                    subcategoryGroup.setAttribute('data-category', category.toLowerCase());
                    subcategoryGroup.style.display = 'none'; // Hide the entire group initially

                    // Create a subcategory header
                    const subcategoryHeader = document.createElement('h3');
                    subcategoryHeader.textContent = subcategory;
                    subcategoryHeader.classList.add('subcategory-header');
                    subcategoryGroup.appendChild(subcategoryHeader);

                    // Loop through each item in the subcategory
                    items.forEach(item => {
                        // Create a card for each item
                        const card = document.createElement('div');
                        card.classList.add('menu-card');
                        card.setAttribute('data-category', category.toLowerCase());

                        // Add item image
                        const itemImage = document.createElement('img');
                        itemImage.src = item.image || 'images/placeholder.jpg';
                        itemImage.alt = item.name;
                        card.appendChild(itemImage);

                        // Add item details
                        const itemDetails = document.createElement('div');
                        itemDetails.classList.add('menu-card-content');
                        itemDetails.innerHTML = `
                            <h4>${item.name}</h4>
                            <p>${item.description}</p>
                            <span>Rs.${item.price}</span>
                        `;
                        card.appendChild(itemDetails);

                        // Add to cart button
                        const addToCartButton = document.createElement('button');
                        addToCartButton.className = 'add-to-cart';
                        addToCartButton.textContent = 'Add to Cart';
                        itemDetails.appendChild(addToCartButton);

                        // Favorite button
                        const favoriteButton = document.createElement('button');
                        favoriteButton.className = 'favorite-button';
                        favoriteButton.textContent = '❤️';
                        favoriteButton.addEventListener('click', () => {
                            if (favorites.includes(item.name)) {
                                favorites = favorites.filter(name => name !== item.name);
                            } else {
                                favorites.push(item.name);
                            }
                            updateFavoritesDisplay();
                        });
                        itemDetails.appendChild(favoriteButton);

                        subcategoryGroup.appendChild(card);
                    });

                    menuCategories.appendChild(subcategoryGroup);
                }
            }

            // Reinitialize event listeners after rendering
            console.log('Menu fetched, initializing event listeners'); // Debugging line
            initializeEventListeners();
        })
        .catch(error => console.error('Error fetching menu items:', error));
});
function initializeEventListeners() {
    // Reinitialize filter functionality
    const filterLinks = document.querySelectorAll('.filter-link');
    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category').toLowerCase();

            // Remove active class from all links
            filterLinks.forEach(lnk => lnk.classList.remove('active'));
            // Add active class to the clicked link
            link.classList.add('active');

            // Hide the welcome message
            const welcomeMessage = document.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.style.display = 'none';
            }

            // Show/hide subcategory groups based on the selected category
            const subcategoryGroups = document.querySelectorAll('.subcategory-group');
            subcategoryGroups.forEach(group => {
                if (category === 'all' || group.getAttribute('data-category') === category) {
                    group.style.display = 'block'; // Show subcategory group
                } else {
                    group.style.display = 'none'; // Hide subcategory group
                }
            });
        });
    });

    // Reinitialize search functionality
    const searchBar = document.getElementById('search');
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            const searchTerm = searchBar.value.toLowerCase();
            const menuItems = document.querySelectorAll('.menu-card');
            menuItems.forEach(item => {
                const itemName = item.querySelector('h4').textContent.toLowerCase();
                if (itemName.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Reinitialize add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemName = button.parentElement.querySelector('h4').textContent;
            const itemPrice = button.parentElement.querySelector('span').textContent;
            cart.push({ name: itemName, price: itemPrice });
            updateCartDisplay();
            alert(`Added ${itemName} (${itemPrice}) to cart!`);
        });
    });
}
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const menuSection = document.getElementById('menu');
    const reservationSection = document.getElementById('reservation');

    function toggleSidebar() {
        const menuSectionRect = menuSection.getBoundingClientRect();
        const reservationSectionRect = reservationSection.getBoundingClientRect();

        // Check if the menu section is in the viewport
        if (menuSectionRect.top <= 0 && menuSectionRect.bottom >= 0) {
            sidebar.classList.add('visible');
            mainContent.classList.add('shifted');

            // Calculate the height of the sidebar
            const sidebarHeight = reservationSectionRect.top - menuSectionRect.top;
            sidebar.style.height = `${sidebarHeight}px`;

            // Calculate the top position relative to the start of the menu section
            sidebar.style.top = `0`; // Since it's absolute, it will be relative to the menu section
        } else {
            sidebar.classList.remove('visible');
            mainContent.classList.remove('shifted');
        }
    }

    // Add scroll event listener to toggle sidebar visibility
    window.addEventListener('scroll', toggleSidebar);

    // Initialize sidebar visibility on page load
    toggleSidebar();
});
document.addEventListener('DOMContentLoaded', function () {
    const orderNowButton = document.getElementById('order-now');
    const orderConfirmationModal = document.getElementById('order-confirmation-modal');
    const orderForm = document.getElementById('order-form');
    const receiptModal = document.getElementById('receipt');
    const receiptContent = document.getElementById('receipt-content');

    // Open order confirmation modal
    if (orderNowButton) {
        orderNowButton.addEventListener('click', () => {
            // Ensure the cart is not empty
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            orderConfirmationModal.style.display = 'block';
        });
    }

    // Close modals
    document.querySelectorAll('.close').forEach(closeButton => {
        closeButton.addEventListener('click', () => {
            orderConfirmationModal.style.display = 'none';
            receiptModal.style.display = 'none';
        });
    });

    // Submit order form
    if (orderForm) {
        orderForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const tableNumber = document.getElementById('table-number').value;
            const specialRequests = document.getElementById('special-requests').value;

            // Format items for better readability
            const formattedItems = cart.map(item => `${item.name} - ${item.price}`).join(', ');

            // Prepare order data
            const order = {
                name,
                tableNumber,
                specialRequests,
                items: formattedItems, // Store items in a human-readable format
                total: cart.reduce((sum, item) => sum + parseFloat(item.price.replace('Rs.', '')), 0).toFixed(2), // Calculate total
            };

            // Send order to server
            fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(order),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Show receipt
                        receiptContent.innerHTML = `
                            <p>Order ID: ${data.orderId}</p>
                            <p>Name: ${name}</p>
                            <p>Table Number: ${tableNumber}</p>
                            <p>Total: Rs.${order.total}</p>
                            <p>Items: ${formattedItems}</p>
                        `;
                        receiptModal.style.display = 'block';
                        orderConfirmationModal.style.display = 'none';

                        // Clear the cart after successful submission
                        cart = [];
                        updateCartDisplay(); // Update the cart display to reflect the empty cart
                    } else {
                        alert('Failed to place order. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
                });
        });
    }
});
    






// Function to shuffle the images
function shuffleImages() {
    const imageGrid = document.querySelector('.about-image-grid');
    const images = Array.from(imageGrid.querySelectorAll('img')); // Convert NodeList to Array

    // Shuffle the array of images
    for (let i = images.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Random index
        [images[i], images[j]] = [images[j], images[i]]; // Swap elements
    }

    // Append the shuffled images back to the grid
    images.forEach(img => imageGrid.appendChild(img));
}
// Shuffle images every 5 seconds (or any interval you prefer)
setInterval(shuffleImages, 1000);
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('reservationForm');
    const steps = document.querySelectorAll('.ir-form-step');
    const progressSteps = document.querySelectorAll('.ir-progress-step');
    const nextButtons = document.querySelectorAll('.ir-next-button');
    const prevButtons = document.querySelectorAll('.ir-prev-button');
    const slider = document.getElementById('guests');
    const sliderValue = document.querySelector('.ir-slider-value');
    const congratulationsDiv = document.getElementById('congratulations');
    const receiptDiv = document.getElementById('receipt');

    let currentStep = 0;

    // Update slider value display
    slider.addEventListener('input', () => {
        sliderValue.textContent = slider.value;
    });

    // Show current step
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });
        progressSteps.forEach((step, index) => {
            step.setAttribute('aria-current', index === stepIndex);
        });
    }

    // Next button click
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    // Previous button click
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    // Validate all steps
    function validateForm() {
        let isValid = true;
        steps.forEach(step => {
            const inputs = step.querySelectorAll('input[required], select[required], textarea[required]');
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('invalid'); // Highlight invalid fields
                } else {
                    input.classList.remove('invalid'); // Remove highlight if valid
                }
            });
        });
        return isValid;
    }

    // Form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate all steps before submission
        if (!validateForm()) {
            alert('Please fill out all required fields.');
            return;
        }

        // Collect form data
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Send data to the server
        fetch('/api/reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    // Hide the form
                    form.classList.add('hidden');

                    // Show the congratulations section
                    congratulationsDiv.classList.remove('hidden');

                    // Populate receipt details
                    document.getElementById('receiptDate').textContent = data.date;
                    document.getElementById('receiptTime').textContent = data.time;
                    document.getElementById('receiptGuests').textContent = data.guests;
                    document.getElementById('receiptName').textContent = data.name;
                    document.getElementById('receiptContact').textContent = data.contact;
                    document.getElementById('receiptEmail').textContent = data.email;
                    document.getElementById('receiptSeating').textContent = data.seating;
                    document.getElementById('receiptSpecialRequests').textContent = data.specialRequests || 'None';
                    document.getElementById('receiptConfirmationMethod').textContent = data.confirmationMethod;

                    // Show the receipt section
                    receiptDiv.classList.remove('hidden');

                    // Trigger confetti
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                } else {
                    alert('Error: ' + result.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
    });

    // Print receipt button
    document.getElementById('printReceiptButton').addEventListener('click', () => {
        window.print();
    });
});



document.addEventListener('DOMContentLoaded', function() {
    const testimonialsCarousel = document.querySelector('.testimonials-carousel');
    const leaveReviewBtn = document.getElementById('leave-review-btn');
    const reviewFormContainer = document.getElementById('review-form-container');
    const reviewForm = document.getElementById('review-form');
    const carouselTrack = document.createElement('div');
    carouselTrack.className = 'carousel-track';
    testimonialsCarousel.appendChild(carouselTrack);

    let currentIndex = 0;

    // Function to fetch testimonials and display them in the carousel
    function fetchTestimonials() {
        fetch('/api/testimonials')
            .then(response => response.json())
            .then(data => {
                carouselTrack.innerHTML = ''; // Clear existing content
                data.forEach(testimonial => {
                    const testimonialCard = document.createElement('div');
                    testimonialCard.className = 'testimonial-card';
                    testimonialCard.innerHTML = `
                        <h3>${testimonial.name}</h3>
                        <p><strong>${testimonial.role}</strong></p>
                        <p>Rating: ${'★'.repeat(testimonial.rating)}</p>
                        <p>${testimonial.review}</p>
                    `;
                    carouselTrack.appendChild(testimonialCard);
                });
                updateCarousel();
            })
            .catch(error => console.error('Error fetching testimonials:', error));
    }

    // Function to update the carousel position
    function updateCarousel() {
        const cardWidth = testimonialsCarousel.offsetWidth;
        carouselTrack.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }

    // Function to move to the next testimonial
    function nextTestimonial() {
        const totalCards = carouselTrack.children.length;
        if (currentIndex < totalCards - 1) {
            currentIndex++;
        } else {
            currentIndex = 0;
        }
        updateCarousel();
    }

    // Function to move to the previous testimonial
    function prevTestimonial() {
        const totalCards = carouselTrack.children.length;
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = totalCards - 1;
        }
        updateCarousel();
    }

    // Show the review form when the "Leave a Review" button is clicked
    leaveReviewBtn.addEventListener('click', () => {
        reviewFormContainer.style.display = 'block';
    });

    // Handle review form submission
    reviewForm.addEventListener('submit', function(event) {
        event.preventDefault();
    
        const formData = new FormData(reviewForm);
        const reviewData = {
            name: formData.get('name'),
            role: formData.get('role'),
            rating: parseInt(formData.get('rating')), // Convert rating to integer
            review: formData.get('review')
        };
    
        fetch('/api/testimonials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Review submitted successfully!');
                reviewForm.reset();
                reviewFormContainer.style.display = 'none';
                fetchTestimonials(); // Refresh the testimonials
            } else {
                alert('Failed to submit review. Please try again.');
            }
        })
        .catch(error => console.error('Error submitting review:', error));
    });

    // Fetch testimonials on page load
    fetchTestimonials();

    // Add event listeners for next and previous buttons (you can add these buttons in your HTML)
    document.getElementById('next-btn').addEventListener('click', nextTestimonial);
    document.getElementById('prev-btn').addEventListener('click', prevTestimonial);
});

document.addEventListener('DOMContentLoaded', function () {
    const productGrid = document.querySelector('.product-grid');
    const filterLinks = document.querySelectorAll('.filter-link');
    const shopCartItems = document.getElementById('shop-cart-items');
    const shopSubtotalElement = document.getElementById('shop-subtotal');
    const shopTotalElement = document.getElementById('shop-total');
    const shopApplyPromoBtn = document.getElementById('shop-apply-promo-btn');
    const shopCheckoutBtn = document.getElementById('shop-checkout-btn');
    const shopPromoCodeInput = document.getElementById('shop-promo-code');
    const shopCartSection = document.getElementById('shop-cart'); // Get the cart section
    const placeholder = document.createElement('div'); // Create a placeholder element

    let shopCart = [];
    let products = [];

    // Initially hide the cart section
    shopCartSection.style.display = 'none';

    // Function to fetch products and display them
    function fetchProducts() {
        fetch('/api/products')
            .then(response => response.json())
            .then(data => {
                products = data; // Store products for later use
                displayProducts(data);
                hideAllProducts(); // Initially hide all products
                showPlaceholder(); // Show placeholder initially
            })
            .catch(error => console.error('Error fetching products:', error));
    }

    // Function to display products
    function displayProducts(products) {
        productGrid.innerHTML = ''; // Clear existing content
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = `product-item ${product.category.toLowerCase()}`;
            productItem.style.display = 'none'; // Initially hide each product
            productItem.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}" class="product-image">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="product-price">₹${product.price.toFixed(2)}</p>
                <div class="product-rating">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))} (${product.review_count} reviews)</div>
                <div class="product-badge">${product.badge}</div>
                <div class="stock-availability">${product.stock_availability}</div>
                <button class="add-to-shop-cart" data-id="${product.id}">Add to Cart</button>
                <button class="quick-view" data-id="${product.id}">Quick View</button>
                <button class="add-to-wishlist" data-id="${product.id}">Save for Later</button>
            `;
            productGrid.appendChild(productItem);
        });

        // Add event listeners to the buttons
        addEventListeners();
    }

    // Function to hide all products initially
    function hideAllProducts() {
        const allProductItems = document.querySelectorAll('.product-item');
        allProductItems.forEach(item => {
            item.style.display = 'none';
        });
    }

    // Function to show products based on category
    function showProductsByCategory(category) {
        const allProductItems = document.querySelectorAll('.product-item');
        allProductItems.forEach(item => {
            if (item.classList.contains(category)) {
                item.style.display = 'block'; // Show products matching category
            } else {
                item.style.display = 'none'; // Hide products not matching category
            }
        });
        hidePlaceholder(); // Hide placeholder when a category is selected
    }

    // Function to show placeholder
    function showPlaceholder() {
        placeholder.className = 'placeholder';
        placeholder.innerHTML = '<p>Please select a category to view products.</p>';
        productGrid.appendChild(placeholder);
    }

    // Function to hide placeholder
    function hidePlaceholder() {
        if (placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
        }
    }

    // Function to add event listeners to buttons
    function addEventListeners() {
        document.querySelectorAll('.add-to-shop-cart').forEach(button => {
            button.addEventListener('click', addToShopCart);
        });

        document.querySelectorAll('.quick-view').forEach(button => {
            button.addEventListener('click', quickView);
        });

        document.querySelectorAll('.add-to-wishlist').forEach(button => {
            button.addEventListener('click', addToWishlist);
        });
    }

    // Function to handle adding to shop cart
    function addToShopCart(event) {
        const productId = event.target.getAttribute('data-id');
        const product = products.find(p => p.id == productId);
        shopCart.push(product);
        updateShopCart();

        // Show the cart section when an item is added
        shopCartSection.style.display = 'block';
    }

    // Function to handle quick view
    function quickView(event) {
        const productId = event.target.getAttribute('data-id');
        const product = products.find(p => p.id == productId);
        alert(`Quick View: ${product.name}\n${product.description}\nPrice: ₹${product.price.toFixed(2)}`);
    }

    // Function to handle adding to wishlist
    function addToWishlist(event) {
        const productId = event.target.getAttribute('data-id');
        const product = products.find(p => p.id == productId);
        alert(`Added to Wishlist: ${product.name}`);
    }

    // Function to update the shop cart
    function updateShopCart() {
        shopCartItems.innerHTML = '';
        let subtotal = 0;
        shopCart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <p>${item.name} - ₹${item.price.toFixed(2)}</p>
            `;
            shopCartItems.appendChild(cartItem);
            subtotal += item.price;
        });
        shopSubtotalElement.textContent = subtotal.toFixed(2);
        shopTotalElement.textContent = subtotal.toFixed(2);
    }

    // Function to apply promo code
    function applyPromoCode() {
        const promoCode = shopPromoCodeInput.value;
        // Here you can add logic to apply the promo code
        alert(`Promo code ${promoCode} applied!`);
    }

    // Function to handle checkout
    function checkout() {
        alert('Proceeding to checkout!');
    }

    // Add event listeners to filter links
    filterLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            showProductsByCategory(category); // Show products for selected category
        });
    });

    // Add event listeners to promo and checkout buttons
    shopApplyPromoBtn.addEventListener('click', applyPromoCode);
    shopCheckoutBtn.addEventListener('click', checkout);

    // Fetch products on page load
    fetchProducts();
});


