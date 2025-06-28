// Function to toggle mobile menu (if needed)
function toggleMenu() {
    const nav = document.querySelector('nav');
    nav.classList.toggle('active');
}

  document.addEventListener('DOMContentLoaded', function() {
    // Collect all navigation links
    const navLinks = document.querySelectorAll('nav ul li a');
    
    // Create a mapping of section id to the corresponding element.
    const sections = Array.from(navLinks).map(link => {
      const id = link.getAttribute('href').substring(1); // remove '#' from href
      return document.getElementById(id);
    });

    // Function to check which section is in view and update the active link
    function highlightNav() {
      const scrollPos = window.scrollY || window.pageYOffset;
      // Optional offset to adjust when the active state should trigger (e.g., header height)
      const offset = 100; 

      sections.forEach((section, index) => {
        if (section) {
          // Determine if current scroll position is within the section
          if (section.offsetTop <= scrollPos + offset && 
              (section.offsetTop + section.offsetHeight) > scrollPos + offset) {
            // Remove active class from all links
            navLinks.forEach(link => link.classList.remove('active'));
            // Add active class to the current section's corresponding nav link
            navLinks[index].classList.add('active');
          }
        }
      });
    }

    // Listen for scroll events
    window.addEventListener('scroll', highlightNav);

    // Initial check in case the page is not at the top when loaded
    highlightNav();
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







// Global Arrays
let cart = [];
let favorites = [];

// -----------------------------------------------------
// Utility Functions
// -----------------------------------------------------
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

// -----------------------------------------------------
// Menu Section Initialization
// -----------------------------------------------------
function initializeMenuEventListeners() {
    // Menu Filters and Search
    const menuContainer = document.getElementById('menu');
    if (!menuContainer) return;

    // Filter functionality (using menu-specific filter links)
    const menuFilterLinks = menuContainer.querySelectorAll('.filters .filter-link');
    menuFilterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category').toLowerCase();

            // Remove active class from all links and add to the clicked one
            menuFilterLinks.forEach(lnk => lnk.classList.remove('active'));
            link.classList.add('active');

            // Hide the welcome message
            const welcomeMessage = menuContainer.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.style.display = 'none';
            }

            // For menu items in dynamic groups (if rendered as subcategory groups)
            const subcategoryGroups = menuContainer.querySelectorAll('.subcategory-group');
            if (subcategoryGroups.length > 0) {
                subcategoryGroups.forEach(group => {
                    if (category === 'all' || group.getAttribute('data-category') === category) {
                        group.style.display = 'block';
                    } else {
                        group.style.display = 'none';
                    }
                });
            } else {
                // Fallback for simple menu cards (if no subcategory grouping)
                const menuItems = menuContainer.querySelectorAll('.menu-card');
                menuItems.forEach(item => {
                    const itemCategory = item.getAttribute('data-category').toLowerCase();
                    if (category === 'all' || itemCategory === category) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            }
        });
    });

    // Search functionality for menu items
    const searchBar = menuContainer.querySelector('#search');
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            const searchTerm = searchBar.value.toLowerCase();
            const menuItems = menuContainer.querySelectorAll('.menu-card');
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

    // Add-to-cart functionality for menu items
    const menuAddToCartButtons = menuContainer.querySelectorAll('.add-to-cart');
    menuAddToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemName = button.parentElement.querySelector('h4').textContent;
            const itemPrice = button.parentElement.querySelector('span').textContent;
            cart.push({ name: itemName, price: itemPrice });
            updateCartDisplay();
            alert(`Added ${itemName} (${itemPrice}) to cart!`);
        });
    });

    // Favorite button functionality for menu items
    const favoriteButtons = menuContainer.querySelectorAll('.favorite-button');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Identify the item name from the card (assumes <h4> holds the name)
            const itemName = button.parentElement.querySelector('h4').textContent;
            if (favorites.includes(itemName)) {
                favorites = favorites.filter(name => name !== itemName);
            } else {
                favorites.push(itemName);
            }
            updateFavoritesDisplay();
        });
    });
}

// Fetch menu items and render them in the menu section
function fetchAndRenderMenuItems() {
    const menuCategories = document.getElementById('menu-categories');
    if (!menuCategories) return;
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
                    subcategoryGroup.style.display = 'none'; // Hide the group initially

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
                        itemDetails.appendChild(favoriteButton);

                        subcategoryGroup.appendChild(card);
                    });

                    menuCategories.appendChild(subcategoryGroup);
                }
            }
            // After menu items are rendered, initialize event listeners for menu
            initializeMenuEventListeners();
        })
        .catch(error => console.error('Error fetching menu items:', error));
}

// -----------------------------------------------------
// Sidebar and Page Layout (Menu Section)
// -----------------------------------------------------
function initializeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const menuSection = document.getElementById('menu');
    const reservationSection = document.getElementById('reservation'); // Ensure this exists or adjust accordingly

    function toggleSidebar() {
        if (!menuSection || !sidebar || !mainContent) return;
        const menuSectionRect = menuSection.getBoundingClientRect();
        let reservationSectionRect;
        if (reservationSection) {
            reservationSectionRect = reservationSection.getBoundingClientRect();
        }

        // Check if the menu section is in the viewport
        if (menuSectionRect.top <= 0 && menuSectionRect.bottom >= 0) {
            sidebar.classList.add('visible');
            mainContent.classList.add('shifted');

            if (reservationSectionRect) {
                // Calculate the height of the sidebar
                const sidebarHeight = reservationSectionRect.top - menuSectionRect.top;
                sidebar.style.height = `${sidebarHeight}px`;
            }

            // Set top position (relative to menu section)
            sidebar.style.top = `0`;
        } else {
            sidebar.classList.remove('visible');
            mainContent.classList.remove('shifted');
        }
    }

    window.addEventListener('scroll', toggleSidebar);
    toggleSidebar();
}

// -----------------------------------------------------
// Order Confirmation and Receipt Modal (Menu Section)
// -----------------------------------------------------
function initializeOrderFunctionality() {
    const orderNowButton = document.getElementById('order-now');
    const orderConfirmationModal = document.getElementById('order-confirmation-modal');
    const orderForm = document.getElementById('order-form');
    const receiptModal = document.getElementById('receipt');
    const receiptContent = document.getElementById('receipt-content');

    // Open order confirmation modal
    if (orderNowButton) {
        orderNowButton.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            orderConfirmationModal.style.display = 'block';
        });
    }

    // Close modals when clicking the close buttons
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

            // Format items for display
            const formattedItems = cart.map(item => `${item.name} - ${item.price}`).join(', ');

            // Prepare order data
            const order = {
                name,
                tableNumber,
                specialRequests,
                items: formattedItems,
                total: cart.reduce((sum, item) => sum + parseFloat(item.price.replace('Rs.', '')), 0).toFixed(2),
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
                        receiptContent.innerHTML = `
                            <p>Order ID: ${data.orderId}</p>
                            <p>Name: ${name}</p>
                            <p>Table Number: ${tableNumber}</p>
                            <p>Total: Rs.${order.total}</p>
                            <p>Items: ${formattedItems}</p>
                        `;
                        receiptModal.style.display = 'block';
                        orderConfirmationModal.style.display = 'none';

                        // Clear cart after successful order
                        cart = [];
                        updateCartDisplay();
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
}

// -----------------------------------------------------
// Clear Cart Button (Menu Section)
// -----------------------------------------------------
function initializeClearCart() {
    const clearCartButton = document.getElementById('clear-cart');
    if (clearCartButton) {
        console.log('Clear Cart button found');
        clearCartButton.addEventListener('click', () => {
            console.log('Clear Cart button clicked');
            console.log('Cart before clearing:', cart);
            cart = [];
            console.log('Cart after clearing:', cart);
            updateCartDisplay();
            alert('Cart cleared!');
        });
    } else {
        console.error('Clear Cart button not found');
    }
}

// -----------------------------------------------------
// Shop Section Initialization
// -----------------------------------------------------
function initializeShopSection() {
    const productGrid = document.querySelector('.product-grid');
    const shopCartItems = document.getElementById('shop-cart-items');
    const shopSubtotalElement = document.getElementById('shop-subtotal');
    const shopTotalElement = document.getElementById('shop-total');
    const shopApplyPromoBtn = document.getElementById('shop-apply-promo-btn');
    const shopCheckoutBtn = document.getElementById('shop-checkout-btn');
    const shopPromoCodeInput = document.getElementById('shop-promo-code');
    const shopCartSection = document.getElementById('shop-cart');

    let shopCart = [];
    let products = [];
    const placeholder = document.createElement('div');

    // Hide the shop cart section initially
    if (shopCartSection) {
        shopCartSection.style.display = 'none';
    }

    // Fetch products and display them in the product grid
    function fetchProducts() {
        fetch('/api/products')
            .then(response => response.json())
            .then(data => {
                products = data;
                displayProducts(data);
                hideAllProducts();
                showPlaceholder();
            })
            .catch(error => console.error('Error fetching products:', error));
    }

    // Display products in the grid
    function displayProducts(products) {
        if (!productGrid) return;
        productGrid.innerHTML = ''; // Clear existing content
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = `product-item ${product.category.toLowerCase()}`;
            productItem.style.display = 'none';
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
        addShopEventListeners();
    }

    // Hide all products initially
    function hideAllProducts() {
        const allProductItems = document.querySelectorAll('.product-item');
        allProductItems.forEach(item => {
            item.style.display = 'none';
        });
    }

    // Show placeholder message
    function showPlaceholder() {
        placeholder.className = 'placeholder';
        placeholder.innerHTML = '<p>Please select a category to view products.</p>';
        if (productGrid) {
            productGrid.appendChild(placeholder);
        }
    }

    // Hide placeholder
    function hidePlaceholder() {
        if (placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
        }
    }

    // Show products by selected category
    function showProductsByCategory(category) {
        const allProductItems = document.querySelectorAll('.product-item');
        allProductItems.forEach(item => {
            if (item.classList.contains(category)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        hidePlaceholder();
    }

    // Add event listeners for shop product buttons
    function addShopEventListeners() {
        // Add-to-cart for shop products
        document.querySelectorAll('.add-to-shop-cart').forEach(button => {
            button.addEventListener('click', addToShopCart);
        });
        // Quick view functionality
        document.querySelectorAll('.quick-view').forEach(button => {
            button.addEventListener('click', quickView);
        });
        // Add-to-wishlist functionality
        document.querySelectorAll('.add-to-wishlist').forEach(button => {
            button.addEventListener('click', addToWishlist);
        });
    }

    // Handle adding product to shop cart
    function addToShopCart(event) {
        const productId = event.target.getAttribute('data-id');
        const product = products.find(p => p.id == productId);
        if (product) {
            shopCart.push(product);
            updateShopCart();
            // Show the cart section when an item is added
            if (shopCartSection) {
                shopCartSection.style.display = 'block';
            }
        }
    }

    // Quick view product details
    function quickView(event) {
        const productId = event.target.getAttribute('data-id');
        const product = products.find(p => p.id == productId);
        if (product) {
            alert(`Quick View: ${product.name}\n${product.description}\nPrice: ₹${product.price.toFixed(2)}`);
        }
    }

    // Add product to wishlist
    function addToWishlist(event) {
        const productId = event.target.getAttribute('data-id');
        const product = products.find(p => p.id == productId);
        if (product) {
            alert(`Added to Wishlist: ${product.name}`);
        }
    }

    // Update shop cart display
    function updateShopCart() {
        if (!shopCartItems) return;
        shopCartItems.innerHTML = '';
        let subtotal = 0;
        shopCart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `<p>${item.name} - ₹${item.price.toFixed(2)}</p>`;
            shopCartItems.appendChild(cartItem);
            subtotal += item.price;
        });
        shopSubtotalElement.textContent = subtotal.toFixed(2);
        shopTotalElement.textContent = subtotal.toFixed(2);
    }

    // Promo code functionality
    function applyPromoCode() {
        const promoCode = shopPromoCodeInput.value;
        // Add your promo code logic here
        alert(`Promo code ${promoCode} applied!`);
    }

    // Checkout functionality
    function checkout() {
        alert('Proceeding to checkout!');
    }

    // Filter links in shop section (using shop-specific filters)
    const shopFilterLinks = document.querySelectorAll('#shop .filters .filter-link');
    shopFilterLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const category = link.getAttribute('data-category').toLowerCase();
            showProductsByCategory(category);
        });
    });

    // Event listeners for promo and checkout buttons
    if (shopApplyPromoBtn) {
        shopApplyPromoBtn.addEventListener('click', applyPromoCode);
    }
    if (shopCheckoutBtn) {
        shopCheckoutBtn.addEventListener('click', checkout);
    }

    // Fetch products on load
    fetchProducts();
}

// -----------------------------------------------------
// Main Initialization (DOM Loaded)
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    // Initialize Menu Section
    fetchAndRenderMenuItems();
    initializeClearCart();
    initializeSidebar();
    initializeOrderFunctionality();

    // Initialize Shop Section
    initializeShopSection();
});










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



// ========================================
// CUSTOMER ACTIVITY TRACKING CODE
// Add these functions to your existing script.js file
// ========================================

// Generate or get session ID
function getSessionId() {
    let sessionId = sessionStorage.getItem('restaurant_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        sessionStorage.setItem('restaurant_session_id', sessionId);
    }
    return sessionId;
}

// Track customer activity
function trackActivity(activityType, details = {}) {
    const activityData = {
        activityType: activityType,
        sessionId: getSessionId(),
        details: {
            ...details,
            pageUrl: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        }
    };
    
    // Send activity data to server
    fetch('/api/track-activity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData),
        credentials: 'include'
    }).catch(error => {
        console.error('Error tracking activity:', error);
    });
}

// Enhanced cart functionality with tracking
function updateCartDisplayWithTracking() {
    updateCartDisplay(); // Call existing function
    
    // Track cart view
    if (cart.length > 0) {
        trackActivity('cart_add', {
            cartItems: cart.length,
            cartValue: cart.reduce((sum, item) => sum + parseFloat(item.price.replace('Rs.', '')), 0)
        });
    }
}

// Track page views
function trackPageView() {
    const pageData = {
        page: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
        timeOnPage: Date.now()
    };
    
    trackActivity('page_view', pageData);
}

// Track menu interactions
function trackMenuInteraction(action, itemName, category = null) {
    trackActivity('menu_interaction', {
        action: action, // 'view', 'add_to_cart', 'add_to_favorites'
        itemName: itemName,
        category: category
    });
}

// Track search activities
function trackSearchActivity(searchTerm, results = 0) {
    trackActivity('search', {
        searchTerm: searchTerm,
        resultsCount: results,
        searchType: 'menu'
    });
}

// Track reservation interactions
function trackReservationActivity(action, details = {}) {
    trackActivity('reservation', {
        action: action, // 'start', 'step_complete', 'submit', 'cancel'
        ...details
    });
}

// Track shop interactions
function trackShopActivity(action, productDetails = {}) {
    trackActivity('shop_interaction', {
        action: action, // 'view_product', 'add_to_cart', 'remove_from_cart', 'checkout'
        ...productDetails
    });
}

// Enhanced order submission with tracking
function enhancedOrderSubmission() {
    const orderData = {
        itemsCount: cart.length,
        totalValue: cart.reduce((sum, item) => sum + parseFloat(item.price.replace('Rs.', '')), 0),
        items: cart.map(item => item.name)
    };
    
    trackActivity('order', {
        action: 'submit',
        ...orderData
    });
}

// Enhanced reservation form tracking
function enhanceReservationForm() {
    const form = document.getElementById('reservationForm');
    if (!form) return;
    
    let currentStep = 1;
    const totalSteps = 4;
    
    // Track form start
    trackReservationActivity('start', { totalSteps: totalSteps });
    
    // Track step progression
    const nextButtons = form.querySelectorAll('.ir-next-button');
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentStep++;
            trackReservationActivity('step_complete', {
                completedStep: currentStep - 1,
                currentStep: currentStep,
                progress: ((currentStep - 1) / totalSteps) * 100
            });
        });
    });
    
    // Track form submission
    form.addEventListener('submit', function() {
        const formData = new FormData(form);
        const reservationData = {
            date: formData.get('date'),
            time: formData.get('time'),
            guests: formData.get('guests'),
            seating: formData.get('seating')
        };
        
        trackReservationActivity('submit', reservationData);
    });
}

// Enhanced menu browsing tracking
function enhanceMenuTracking() {
    // Track menu section views
    const menuFilterLinks = document.querySelectorAll('#menu .filter-link');
    menuFilterLinks.forEach(link => {
        link.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            trackActivity('menu_category_view', {
                category: category,
                timestamp: new Date().toISOString()
            });
        });
    });
    
    // Track menu item views (when items come into viewport)
    if ('IntersectionObserver' in window) {
        const menuItemObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const itemName = entry.target.querySelector('h4')?.textContent;
                    const category = entry.target.getAttribute('data-category');
                    
                    if (itemName) {
                        trackMenuInteraction('view', itemName, category);
                    }
                }
            });
        }, { threshold: 0.5 });
        
        // Observe menu items when they're added to DOM
        const observeMenuItems = () => {
            const menuItems = document.querySelectorAll('.menu-card');
            menuItems.forEach(item => {
                if (!item.hasAttribute('data-observed')) {
                    menuItemObserver.observe(item);
                    item.setAttribute('data-observed', 'true');
                }
            });
        };
        
        // Initial observation
        setTimeout(observeMenuItems, 1000);
        
        // Re-observe when menu is updated
        const menuContainer = document.getElementById('menu-categories');
        if (menuContainer) {
            const menuObserver = new MutationObserver(observeMenuItems);
            menuObserver.observe(menuContainer, { childList: true, subtree: true });
        }
    }
}

// Enhanced search tracking
function enhanceSearchTracking() {
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"], input[type="text"][placeholder*="search"]');
    
    searchInputs.forEach(input => {
        let searchTimeout;
        
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = this.value.trim();
                if (searchTerm.length >= 2) {
                    // Count visible results
                    const visibleItems = document.querySelectorAll('.menu-card:not([style*="display: none"]), .product-item:not([style*="display: none"])').length;
                    trackSearchActivity(searchTerm, visibleItems);
                }
            }, 500);
        });
    });
}

// Enhanced cart tracking
function enhanceCartTracking() {
    // Override existing add to cart functions
    const originalUpdateCartDisplay = window.updateCartDisplay;
    window.updateCartDisplay = function() {
        originalUpdateCartDisplay?.();
        
        // Track cart state
        if (cart.length > 0) {
            const cartValue = cart.reduce((sum, item) => sum + parseFloat(item.price.replace('Rs.', '')), 0);
            trackActivity('cart_view', {
                itemsCount: cart.length,
                cartValue: cartValue,
                items: cart.map(item => ({ name: item.name, price: item.price }))
            });
        }
    };
    
    // Track cart clearing
    const clearCartButton = document.getElementById('clear-cart');
    if (clearCartButton) {
        clearCartButton.addEventListener('click', function() {
            trackActivity('cart_clear', {
                itemsRemoved: cart.length,
                valueRemoved: cart.reduce((sum, item) => sum + parseFloat(item.price.replace('Rs.', '')), 0)
            });
        });
    }
}

// Enhanced shop tracking
function enhanceShopTracking() {
    // Track product category browsing
    const shopFilterLinks = document.querySelectorAll('#shop .filter-link');
    shopFilterLinks.forEach(link => {
        link.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            trackShopActivity('category_view', { category: category });
        });
    });
    
    // Track product interactions
    document.addEventListener('click', function(e) {
        // Track add to cart for shop items
        if (e.target.classList.contains('add-to-shop-cart')) {
            const productCard = e.target.closest('.product-item');
            if (productCard) {
                const productName = productCard.querySelector('h3')?.textContent;
                const productPrice = productCard.querySelector('.product-price')?.textContent;
                const productCategory = productCard.className.match(/\b(\w+)\b/)?.[1];
                
                trackShopActivity('add_to_cart', {
                    productName: productName,
                    productPrice: productPrice,
                    productCategory: productCategory
                });
            }
        }
        
        // Track quick view
        if (e.target.classList.contains('quick-view')) {
            const productCard = e.target.closest('.product-item');
            if (productCard) {
                const productName = productCard.querySelector('h3')?.textContent;
                trackShopActivity('quick_view', { productName: productName });
            }
        }
        
        // Track wishlist additions
        if (e.target.classList.contains('add-to-wishlist')) {
            const productCard = e.target.closest('.product-item');
            if (productCard) {
                const productName = productCard.querySelector('h3')?.textContent;
                trackShopActivity('add_to_wishlist', { productName: productName });
            }
        }
    });
}

// Track testimonial interactions
function enhanceTestimonialTracking() {
    const leaveReviewBtn = document.getElementById('leave-review-btn');
    if (leaveReviewBtn) {
        leaveReviewBtn.addEventListener('click', function() {
            trackActivity('review', { action: 'start_review' });
        });
    }
    
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function() {
            const rating = document.getElementById('rating')?.value;
            trackActivity('review', {
                action: 'submit_review',
                rating: rating
            });
        });
    }
}

// Track scroll depth for engagement metrics
function trackScrollDepth() {
    let maxScroll = 0;
    let scrollCheckpoints = [25, 50, 75, 90, 100];
    let reachedCheckpoints = [];
    
    function checkScrollDepth() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);
        
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            
            // Check if we've reached any new checkpoints
            scrollCheckpoints.forEach(checkpoint => {
                if (scrollPercent >= checkpoint && !reachedCheckpoints.includes(checkpoint)) {
                    reachedCheckpoints.push(checkpoint);
                    trackActivity('scroll_depth', {
                        depth: checkpoint,
                        page: window.location.pathname
                    });
                }
            });
        }
    }
    
    // Throttled scroll listener
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
            checkScrollDepth();
            scrollTimeout = null;
        }, 100);
    });
}

// Track time spent on page
function trackTimeOnPage() {
    const startTime = Date.now();
    let lastActivityTime = startTime;
    let totalActiveTime = 0;
    let isActive = true;
    
    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
        document.addEventListener(event, function() {
            const now = Date.now();
            if (isActive) {
                totalActiveTime += now - lastActivityTime;
            }
            lastActivityTime = now;
            isActive = true;
        });
    });
    
    // Track when user becomes inactive
    let inactivityTimer;
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            isActive = false;
        }, 30000); // 30 seconds of inactivity
    }
    
    activityEvents.forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
    });
    resetInactivityTimer();
    
    // Send time data when user leaves page
    window.addEventListener('beforeunload', function() {
        const now = Date.now();
        if (isActive) {
            totalActiveTime += now - lastActivityTime;
        }
        
        trackActivity('time_on_page', {
            totalTime: now - startTime,
            activeTime: totalActiveTime,
            page: window.location.pathname
        });
    });
    
    // Also send periodic updates for long sessions
    setInterval(() => {
        const now = Date.now();
        if (isActive) {
            trackActivity('session_heartbeat', {
                sessionTime: now - startTime,
                activeTime: totalActiveTime + (now - lastActivityTime),
                page: window.location.pathname
            });
        }
    }, 300000); // Every 5 minutes
}

// Track form abandonment
function trackFormAbandonment() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        let formStarted = false;
        let formData = {};
        
        // Track when user starts filling form
        form.addEventListener('input', function(e) {
            if (!formStarted) {
                formStarted = true;
                trackActivity('form_start', {
                    formId: form.id || 'unknown',
                    formType: form.className || 'unknown'
                });
            }
            
            // Store field completion
            formData[e.target.name || e.target.id] = !!e.target.value;
        });
        
        // Track form submission
        form.addEventListener('submit', function() {
            trackActivity('form_complete', {
                formId: form.id || 'unknown',
                completedFields: Object.values(formData).filter(Boolean).length,
                totalFields: Object.keys(formData).length
            });
        });
        
        // Track form abandonment (when user navigates away)
        window.addEventListener('beforeunload', function() {
            if (formStarted && !form.querySelector('input[type="submit"]:focus')) {
                trackActivity('form_abandon', {
                    formId: form.id || 'unknown',
                    completedFields: Object.values(formData).filter(Boolean).length,
                    totalFields: Object.keys(formData).length,
                    abandonedAt: Date.now()
                });
            }
        });
    });
}

// Initialize all tracking
document.addEventListener('DOMContentLoaded', function() {
    // Basic page tracking
    trackPageView();
    
    // Enhanced feature tracking
    enhanceReservationForm();
    enhanceMenuTracking();
    enhanceSearchTracking();
    enhanceCartTracking();
    enhanceShopTracking();
    enhanceTestimonialTracking();
    
    // Engagement tracking
    trackScrollDepth();
    trackTimeOnPage();
    trackFormAbandonment();
    
    // Track when user becomes active/inactive
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            trackActivity('page_hidden', { timestamp: new Date().toISOString() });
        } else {
            trackActivity('page_visible', { timestamp: new Date().toISOString() });
        }
    });
});

// Track when user clicks external links
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href && !link.href.includes(window.location.hostname)) {
        trackActivity('external_link_click', {
            url: link.href,
            text: link.textContent?.trim() || '',
            page: window.location.pathname
        });
    }
});

// Track errors for debugging
window.addEventListener('error', function(e) {
    trackActivity('javascript_error', {
        error: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno,
        page: window.location.pathname
    });
});

