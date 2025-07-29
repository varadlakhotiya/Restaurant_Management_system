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
    if (!imageGrid) return;
    
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

// ========================================
// ENHANCED CART FUNCTIONALITY
// ========================================

// Enhanced Cart Display Function
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartElement = document.getElementById('cart');
    const cartTotal = document.getElementById('cart-total');

    if (cartItems && cartElement) {
        if (cart.length > 0) {
            cartItems.innerHTML = cart.map((item, index) => `
                <div class="cart-item" data-index="${index}">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">${item.price}</span>
                    <button class="remove-item" onclick="removeFromCart(${index})" title="Remove item">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
            // Calculate and display total
            if (cartTotal) {
                const total = cart.reduce((sum, item) => {
                    const price = parseFloat(item.price.replace('Rs.', '').replace('₹', ''));
                    return sum + price;
                }, 0);
                cartTotal.innerHTML = `<strong>Total: ₹${total.toFixed(2)}</strong>`;
            }
        } else {
            cartItems.innerHTML = `<div class="empty-cart-message">Your cart is empty.</div>`;
            if (cartTotal) cartTotal.innerHTML = '';
        }

        // Always show the cart
        cartElement.classList.add('visible');
        console.log('Cart updated. Items count:', cart.length);
    } else {
        console.error('Cart elements not found');
    }
}

// Enhanced cart functionality with error handling
function removeFromCart(index) {
    try {
        if (index >= 0 && index < cart.length) {
            const removedItem = cart.splice(index, 1)[0];
            updateCartDisplay();
            console.log('Removed item from cart:', removedItem);
            showNotification(`Removed ${removedItem.name} from cart`, 'info');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        // Force restore scrolling on error
        document.body.style.overflow = 'auto';
        document.body.style.position = '';
        document.body.style.width = '';
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

// Enhanced form validation
function validateOrderForm() {
    const name = document.getElementById('name');
    const tableNumber = document.getElementById('table-number');
    
    let isValid = true;
    let errorMessage = '';
    
    if (!name || !name.value.trim()) {
        errorMessage += 'Name is required.\n';
        isValid = false;
    }
    
    if (!tableNumber || !tableNumber.value.trim()) {
        errorMessage += 'Table number is required.\n';
        isValid = false;
    } else if (!/^[A-Za-z]?\d+$/.test(tableNumber.value.trim())) {
        errorMessage += 'Please enter a valid table number (e.g., A1, B5, 10).\n';
        isValid = false;
    }
    
    if (cart.length === 0) {
        errorMessage += 'Please add items to your cart before ordering.\n';
        isValid = false;
    }
    
    if (!isValid) {
        showNotification(errorMessage.trim(), 'error');
    }
    
    return isValid;
}

// Enhanced cart toggle functionality
function initializeCartToggle() {
    const toggleCartBtn = document.getElementById('toggle-cart');
    const cartBody = document.querySelector('#cart .cart-body');
    const toggleIcon = toggleCartBtn ? toggleCartBtn.querySelector('i') : null;
    
    if (toggleCartBtn && cartBody) {
        toggleCartBtn.addEventListener('click', () => {
            const isVisible = cartBody.style.display !== 'none';
            
            if (isVisible) {
                cartBody.style.display = 'none';
                if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down';
            } else {
                cartBody.style.display = 'block';
                if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up';
            }
        });
    }
}

// Format currency
function formatCurrency(amount) {
    return `₹${parseFloat(amount).toFixed(2)}`;
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced error handling for API calls
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error(`API call failed for ${url}:`, error);
        throw error;
    }
}

// ========================================
// ENHANCED MENU FUNCTIONALITY
// ========================================

// Enhanced menu item event listeners with better error handling
function initializeMenuEventListeners() {
    const menuContainer = document.getElementById('menu');
    if (!menuContainer) {
        console.error('Menu container not found');
        return;
    }

    // Filter functionality
    const menuFilterLinks = menuContainer.querySelectorAll('.filters .filter-link');
    menuFilterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            try {
                const category = link.getAttribute('data-category').toLowerCase();

                // Remove active class from all links and add to the clicked one
                menuFilterLinks.forEach(lnk => lnk.classList.remove('active'));
                link.classList.add('active');

                // Hide the welcome message
                const welcomeMessage = menuContainer.querySelector('.welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.style.display = 'none';
                }

                // Filter menu items
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
                
                console.log('Menu filtered by category:', category);
            } catch (error) {
                console.error('Error filtering menu:', error);
                showNotification('Error filtering menu items', 'error');
            }
        });
    });

    // Enhanced search functionality
    const searchBar = menuContainer.querySelector('#search');
    if (searchBar) {
        const debouncedSearch = debounce((searchTerm) => {
            try {
                const menuItems = menuContainer.querySelectorAll('.menu-card');
                let visibleCount = 0;
                
                menuItems.forEach(item => {
                    const itemName = item.querySelector('h4') ? item.querySelector('h4').textContent.toLowerCase() : '';
                    const itemDescription = item.querySelector('p') ? item.querySelector('p').textContent.toLowerCase() : '';
                    
                    if (itemName.includes(searchTerm) || itemDescription.includes(searchTerm)) {
                        item.style.display = 'block';
                        visibleCount++;
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                // Show search results feedback
                if (searchTerm && visibleCount === 0) {
                    showNotification('No menu items found matching your search', 'warning');
                }
                
                console.log('Search completed:', searchTerm, 'Results:', visibleCount);
            } catch (error) {
                console.error('Error searching menu:', error);
                showNotification('Error searching menu items', 'error');
            }
        }, 300);
        
        searchBar.addEventListener('input', (e) => {
            debouncedSearch(e.target.value.toLowerCase());
        });
    }

    // Enhanced add-to-cart functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            try {
                const menuCard = e.target.closest('.menu-card');
                if (!menuCard) return;
                
                const itemName = menuCard.querySelector('h4') ? menuCard.querySelector('h4').textContent : 'Unknown Item';
                const itemPriceElement = menuCard.querySelector('span');
                const itemPrice = itemPriceElement ? itemPriceElement.textContent : '₹0';
                
                // Add to cart
                cart.push({ name: itemName, price: itemPrice });
                updateCartDisplay();
                
                // Visual feedback
                const button = e.target;
                const originalText = button.textContent;
                button.textContent = 'Added!';
                button.style.backgroundColor = '#4caf50';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = '';
                }, 1000);
                
                showNotification(`Added ${itemName} to cart!`, 'success');
                console.log('Added to cart:', itemName, itemPrice);
            } catch (error) {
                console.error('Error adding to cart:', error);
                showNotification('Error adding item to cart', 'error');
            }
        }
        
        // Enhanced favorite button functionality
        if (e.target.classList.contains('favorite-button')) {
            try {
                const menuCard = e.target.closest('.menu-card');
                if (!menuCard) return;
                
                const itemName = menuCard.querySelector('h4') ? menuCard.querySelector('h4').textContent : 'Unknown Item';
                const button = e.target;
                
                if (favorites.includes(itemName)) {
                    favorites = favorites.filter(name => name !== itemName);
                    button.style.color = '';
                    showNotification(`Removed ${itemName} from favorites`, 'info');
                } else {
                    favorites.push(itemName);
                    button.style.color = '#ff4444';
                    showNotification(`Added ${itemName} to favorites!`, 'success');
                }
                
                updateFavoritesDisplay();
                console.log('Favorites updated:', favorites);
            } catch (error) {
                console.error('Error updating favorites:', error);
                showNotification('Error updating favorites', 'error');
            }
        }
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
                            <span>₹${item.price}</span>
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
        .catch(error => {
            console.error('Error fetching menu items:', error);
            showNotification('Failed to load menu items', 'error');
        });
}

// ========================================
// ENHANCED ORDER FUNCTIONALITY
// ========================================

// ========================================
// FIXED ORDER FUNCTIONALITY
// ========================================

function initializeOrderFunctionality() {
    const orderNowButton = document.getElementById('order-now');
    const orderConfirmationModal = document.getElementById('order-confirmation-modal');
    const orderForm = document.getElementById('order-form');
    const receiptModal = document.getElementById('receipt');
    const receiptContent = document.getElementById('receipt-content');

    console.log('Initializing order functionality...');
    console.log('Order button found:', !!orderNowButton);
    console.log('Order modal found:', !!orderConfirmationModal);
    console.log('Receipt modal found:', !!receiptModal);

    // Open order confirmation modal
    if (orderNowButton) {
        orderNowButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Order Now clicked, cart:', cart);
            
            if (cart.length === 0) {
                showNotification('Your cart is empty! Please add some items before ordering.', 'warning');
                return;
            }
            
            // Update order summary before showing modal
            updateOrderSummary();
            
            if (orderConfirmationModal) {
                showModal(orderConfirmationModal);
                console.log('Order modal opened');
            } else {
                console.error('Order confirmation modal not found');
                showNotification('Error: Order form not available. Please refresh the page.', 'error');
            }
        });
    } else {
        console.error('Order Now button not found');
    }

    // Function to update order summary in modal
    function updateOrderSummary() {
        const orderItemsList = document.getElementById('order-items-list');
        const orderTotalDisplay = document.getElementById('order-total-display');
        
        if (orderItemsList && cart.length > 0) {
            orderItemsList.innerHTML = cart.map(item => `
                <div class="order-summary-item">
                    <span>${item.name}</span>
                    <span>${item.price}</span>
                </div>
            `).join('');
        }
        
        if (orderTotalDisplay) {
            const total = cart.reduce((sum, item) => {
                const price = parseFloat(item.price.replace('Rs.', '').replace('₹', ''));
                return sum + price;
            }, 0);
            orderTotalDisplay.innerHTML = `<strong>Total: ₹${total.toFixed(2)}</strong>`;
        }
    }

    // Enhanced order form submission
    if (orderForm) {
        orderForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Order form submitted');
            
            // Get form values with enhanced error checking
            const nameField = document.getElementById('name');
            const tableNumberField = document.getElementById('table-number');
            const specialRequestsField = document.getElementById('special-requests');
            
            if (!nameField || !tableNumberField) {
                showNotification('Required form fields not found. Please refresh the page and try again.', 'error');
                return;
            }
            
            const name = nameField.value.trim();
            const tableNumber = tableNumberField.value.trim();
            const specialRequests = specialRequestsField ? specialRequestsField.value.trim() : '';

            // Enhanced validation
            if (!name || !tableNumber) {
                showNotification('Please fill in all required fields (Name and Table Number).', 'error');
                return;
            }

            if (cart.length === 0) {
                showNotification('Your cart is empty. Please add items before ordering.', 'error');
                return;
            }

            // Format items for display and calculate total
            const formattedItems = cart.map(item => `${item.name} - ${item.price}`).join(', ');
            const total = cart.reduce((sum, item) => {
                const price = parseFloat(item.price.replace('Rs.', '').replace('₹', ''));
                return sum + price;
            }, 0);

            // Prepare order data
            const orderData = {
                name: name,
                tableNumber: tableNumber,
                specialRequests: specialRequests,
                items: formattedItems,
                total: total.toFixed(2),
            };

            console.log('Sending order data:', orderData);

            // Show loading state
            const submitButton = orderForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Placing Order...';
            submitButton.disabled = true;

            // Send order to server
            fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
                credentials: 'include'
            })
            .then(response => {
                console.log('Order response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Order response data:', data);
                
                // Reset button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                
                if (data.success) {
                    // Hide order modal first
                    hideModal(orderConfirmationModal);
                    
                    // Show success receipt after a small delay
                    setTimeout(() => {
                        showOrderReceipt({
                            orderId: data.orderId,
                            name: name,
                            tableNumber: tableNumber,
                            items: formattedItems,
                            total: total.toFixed(2),
                            specialRequests: specialRequests,
                            orderTime: new Date().toLocaleString()
                        });
                    }, 100);
                    
                    // Clear cart after successful order
                    cart = [];
                    updateCartDisplay();
                    
                    // Reset form
                    orderForm.reset();
                    
                    showNotification('Order placed successfully!', 'success');
                    console.log('Order placed successfully');
                } else {
                    throw new Error(data.message || 'Unknown error occurred');
                }
            })
            .catch(error => {
                console.error('Order submission error:', error);
                
                // Reset button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                
                showNotification('An error occurred while placing your order: ' + error.message, 'error');
            });
        });
    } else {
        console.error('Order form not found');
    }
}



// ========================================
// ENHANCED MODAL MANAGEMENT
// ========================================

function showModal(modal) {
    if (!modal) return;
    
    // First restore scrolling if it was disabled
    document.body.style.overflow = 'auto';
    
    // Hide all other modals first
    hideAllModals();
    
    // Show the requested modal
    modal.style.display = 'block';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    
    // Disable background scrolling
    document.body.style.overflow = 'hidden';
    
    console.log('Modal shown:', modal.id);
}

function hideModal(modal) {
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    
    // Restore scrolling
    document.body.style.overflow = 'auto';
    
    console.log('Modal hidden:', modal.id);
}

function hideAllModals() {
    // List of all modal IDs
    const modalIds = [
        'order-confirmation-modal',
        'receipt',
        'shop-receipt-modal'
    ];
    
    modalIds.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            hideModal(modal);
        }
    });
    
    // Ensure scrolling is restored
    document.body.style.overflow = 'auto';
    
    console.log('All modals hidden and scrolling restored');
}

// Enhanced function to show order receipt
function showOrderReceipt(orderData) {
    const receiptModal = document.getElementById('receipt');
    const receiptContent = document.getElementById('receipt-content');
    
    console.log('Attempting to show order receipt:', orderData);
    
    if (!receiptModal || !receiptContent) {
        console.error('Receipt modal or content not found');
        showNotification('Order placed successfully! Receipt unavailable - check browser console.', 'success');
        // Ensure scrolling is restored even if modal fails
        document.body.style.overflow = 'auto';
        return;
    }
    
    receiptContent.innerHTML = `
        <div class="receipt-header">
            <h2>🎉 Order Confirmation</h2>
            <p>Thank you for your order!</p>
        </div>
        <div class="receipt-details">
            <div class="receipt-row">
                <strong>Order ID:</strong> <span>#${orderData.orderId}</span>
            </div>
            <div class="receipt-row">
                <strong>Customer:</strong> <span>${orderData.name}</span>
            </div>
            <div class="receipt-row">
                <strong>Table Number:</strong> <span>${orderData.tableNumber}</span>
            </div>
            <div class="receipt-row">
                <strong>Items:</strong>
                <div class="receipt-items">
                    ${orderData.items}
                </div>
            </div>
            <div class="receipt-row total-row">
                <strong>Total Amount:</strong> <span class="total-amount">₹${orderData.total}</span>
            </div>
            ${orderData.specialRequests ? `
            <div class="receipt-row">
                <strong>Special Requests:</strong> <span>${orderData.specialRequests}</span>
            </div>
            ` : ''}
            <div class="receipt-row">
                <strong>Order Time:</strong> <span>${orderData.orderTime}</span>
            </div>
        </div>
        <div class="receipt-footer">
            <p>✅ Your order has been sent to the kitchen!</p>
            <p>📱 You will receive updates on your order status.</p>
        </div>
    `;
    
    // Show receipt modal using the enhanced function
    showModal(receiptModal);
    
    console.log('Receipt displayed successfully');
}

// Enhanced function to show order receipt
function showOrderReceipt(orderData) {
    const receiptModal = document.getElementById('receipt');
    const receiptContent = document.getElementById('receipt-content');
    
    if (!receiptModal || !receiptContent) {
        console.error('Receipt modal or content not found');
        showNotification('Order placed successfully! Receipt unavailable.', 'success');
        return;
    }
    
    receiptContent.innerHTML = `
        <div class="receipt-header">
            <h2>🎉 Order Confirmation</h2>
            <p>Thank you for your order!</p>
        </div>
        <div class="receipt-details">
            <div class="receipt-row">
                <strong>Order ID:</strong> <span>#${orderData.orderId}</span>
            </div>
            <div class="receipt-row">
                <strong>Customer:</strong> <span>${orderData.name}</span>
            </div>
            <div class="receipt-row">
                <strong>Table Number:</strong> <span>${orderData.tableNumber}</span>
            </div>
            <div class="receipt-row">
                <strong>Items:</strong>
                <div class="receipt-items">
                    ${orderData.items}
                </div>
            </div>
            <div class="receipt-row total-row">
                <strong>Total Amount:</strong> <span class="total-amount">₹${orderData.total}</span>
            </div>
            ${orderData.specialRequests ? `
            <div class="receipt-row">
                <strong>Special Requests:</strong> <span>${orderData.specialRequests}</span>
            </div>
            ` : ''}
            <div class="receipt-row">
                <strong>Order Time:</strong> <span>${orderData.orderTime}</span>
            </div>
        </div>
        <div class="receipt-footer">
            <p>✅ Your order has been sent to the kitchen!</p>
            <p>📱 You will receive updates on your order status.</p>
        </div>
    `;
    
    // Show receipt modal
    receiptModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Auto-hide after 10 seconds (optional)
    setTimeout(() => {
        if (receiptModal.style.display === 'block') {
            showNotification('Receipt will remain open. Click the close button when done.', 'info');
        }
    }, 10000);
    
    console.log('Receipt displayed successfully');
}

// Enhanced clear cart functionality
function initializeClearCart() {
    const clearCartButton = document.getElementById('clear-cart');
    if (clearCartButton) {
        clearCartButton.addEventListener('click', () => {
            try {
                if (cart.length === 0) {
                    showNotification('Cart is already empty', 'info');
                    return;
                }
                
                const itemCount = cart.length;
                cart = [];
                updateCartDisplay();
                
                showNotification(`Cleared ${itemCount} items from cart`, 'success');
                console.log('Cart cleared');
            } catch (error) {
                console.error('Error clearing cart:', error);
                showNotification('Error clearing cart', 'error');
            }
        });
    } else {
        console.warn('Clear cart button not found');
    }
}

// ========================================
// ENHANCED SHOP FUNCTIONALITY
// ========================================

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

    // Make shopCart globally available
    window.shopCart = shopCart;

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
            .catch(error => {
                console.error('Error fetching products:', error);
                showNotification('Failed to load products', 'error');
            });
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
        event.preventDefault();
        const productId = event.target.getAttribute('data-id');
        const product = products.find(p => p.id == productId);
        
        if (product) {
            // Check if product already in cart
            const existingItem = shopCart.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                shopCart.push({...product, quantity: 1});
            }
            
            updateShopCart();
            
            // Visual feedback
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Added!';
            button.style.backgroundColor = '#4caf50';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
            }, 1000);
            
            // Show the cart section when an item is added
            if (shopCartSection) {
                shopCartSection.style.display = 'block';
            }
            
            showNotification(`Added ${product.name} to shop cart!`, 'success');
            console.log('Added to shop cart:', product.name);
        }
    }

    // Quick view product details
    function quickView(event) {
        event.preventDefault();
        const productId = event.target.getAttribute('data-id');
        const product = products.find(p => p.id == productId);
        if (product) {
            alert(`Quick View: ${product.name}\n${product.description}\nPrice: ₹${product.price.toFixed(2)}\nRating: ${product.rating}/5 (${product.review_count} reviews)`);
        }
    }

    // Add product to wishlist
    function addToWishlist(event) {
        event.preventDefault();
        const productId = event.target.getAttribute('data-id');
        const product = products.find(p => p.id == productId);
        if (product) {
            // Visual feedback
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Saved!';
            button.style.backgroundColor = '#ff9800';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
            }, 1000);
            
            showNotification(`Added ${product.name} to wishlist!`, 'success');
            console.log('Added to wishlist:', product.name);
        }
    }

    // Update shop cart display
    function updateShopCart() {
        if (!shopCartItems) return;
        
        shopCartItems.innerHTML = '';
        let subtotal = 0;
        
        if (shopCart.length === 0) {
            shopCartItems.innerHTML = '<div class="empty-cart-message">Your shopping cart is empty.</div>';
            if (shopSubtotalElement) shopSubtotalElement.textContent = '0.00';
            if (shopTotalElement) shopTotalElement.textContent = '0.00';
            return;
        }
        
        shopCart.forEach((item, index) => {
            const itemTotal = item.price * (item.quantity || 1);
            subtotal += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'shop-cart-item';
            cartItem.innerHTML = `
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>₹${item.price.toFixed(2)} each</p>
                </div>
                <div class="item-controls">
                    <button class="quantity-btn" onclick="updateShopCartQuantity(${index}, -1)">-</button>
                    <span class="quantity">${item.quantity || 1}</span>
                    <button class="quantity-btn" onclick="updateShopCartQuantity(${index}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromShopCart(${index})">Remove</button>
                </div>
                <div class="item-total">₹${itemTotal.toFixed(2)}</div>
            `;
            shopCartItems.appendChild(cartItem);
        });
        
        if (shopSubtotalElement) shopSubtotalElement.textContent = subtotal.toFixed(2);
        if (shopTotalElement) shopTotalElement.textContent = subtotal.toFixed(2);
        
        console.log('Shop cart updated. Items:', shopCart.length, 'Total:', subtotal);
    }

    // Make functions globally available for onclick handlers
    window.updateShopCartQuantity = function(index, change) {
        if (index >= 0 && index < shopCart.length) {
            const newQuantity = (shopCart[index].quantity || 1) + change;
            if (newQuantity <= 0) {
                const removedItem = shopCart.splice(index, 1)[0];
                showNotification(`Removed ${removedItem.name} from cart`, 'info');
            } else {
                shopCart[index].quantity = newQuantity;
            }
            updateShopCart();
        }
    };

    window.updateShopCart = updateShopCart;

    window.removeFromShopCart = function(index) {
        if (index >= 0 && index < shopCart.length) {
            const removedItem = shopCart.splice(index, 1)[0];
            updateShopCart();
            showNotification(`Removed ${removedItem.name} from shop cart`, 'info');
            console.log('Removed from shop cart:', removedItem.name);
        }
    };

    // ========================================
// ENHANCED SHOP FUNCTIONALITY
// ========================================

function enhancedShopCheckout() {
    const shopCheckoutBtn = document.getElementById('shop-checkout-btn');
    
    if (!shopCheckoutBtn) {
        console.error('Shop checkout button not found');
        return;
    }
    
    shopCheckoutBtn.addEventListener('click', function() {
        console.log('Shop checkout clicked, cart:', shopCart);
        
        if (!shopCart || shopCart.length === 0) {
            showNotification('Your shopping cart is empty!', 'warning');
            return;
        }
        
        const total = shopCart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const itemsList = shopCart.map(item => `${item.name} (x${item.quantity || 1}) - ₹${(item.price * (item.quantity || 1)).toFixed(2)}`);
        
        // Show confirmation dialog
        const confirmationMessage = `🛒 Checkout Summary:\n\n${itemsList.join('\n')}\n\n💰 Total: ₹${total.toFixed(2)}\n\nProceed with checkout?`;
        
        if (confirm(confirmationMessage)) {
            processShopOrder(total, itemsList);
        }
    });
}

function processShopOrder(total, itemsList) {
    // Simulate processing delay
    showNotification('Processing your order...', 'info');
    
    // Prepare shop order data
    const shopOrderData = {
        type: 'shop',
        items: itemsList.join(', '),
        total: total.toFixed(2),
        orderTime: new Date().toISOString(),
        orderId: 'SHOP-' + Date.now()
    };
    
    // Simulate successful order
    setTimeout(() => {
        showShopReceipt(shopOrderData);
        
        // Clear shop cart
        shopCart = [];
        updateShopCart();
        
        // Hide cart section
        const shopCartSection = document.getElementById('shop-cart');
        if (shopCartSection) {
            shopCartSection.style.display = 'none';
        }
        
        showNotification('Shop order placed successfully!', 'success');
    }, 2000);
}

function showShopReceipt(orderData) {
    const shopReceiptModal = document.getElementById('shop-receipt-modal');
    const shopReceiptContent = document.getElementById('shop-receipt-content');
    
    console.log('Attempting to show shop receipt:', orderData);
    
    if (!shopReceiptModal || !shopReceiptContent) {
        console.error('Shop receipt modal not found');
        showNotification('Order placed successfully! Receipt unavailable - check browser console.', 'success');
        // Ensure scrolling is restored even if modal fails
        document.body.style.overflow = 'auto';
        return;
    }
    
    shopReceiptContent.innerHTML = `
        <div class="receipt-header">
            <h2>🛍️ Shop Order Confirmation</h2>
            <p>Thank you for your purchase!</p>
        </div>
        <div class="receipt-details">
            <div class="receipt-row">
                <strong>Order ID:</strong> <span>#${orderData.orderId}</span>
            </div>
            <div class="receipt-row">
                <strong>Order Type:</strong> <span>Shop Purchase</span>
            </div>
            <div class="receipt-row">
                <strong>Items:</strong>
                <div class="receipt-items">
                    ${orderData.items.split(', ').map(item => `<div class="item-line">${item}</div>`).join('')}
                </div>
            </div>
            <div class="receipt-row total-row">
                <strong>Total Amount:</strong> <span class="total-amount">₹${orderData.total}</span>
            </div>
            <div class="receipt-row">
                <strong>Order Time:</strong> <span>${new Date(orderData.orderTime).toLocaleString()}</span>
            </div>
        </div>
        <div class="receipt-footer">
            <p>📦 Your items will be prepared for pickup/delivery.</p>
            <p>📞 Contact us for any questions about your order.</p>
        </div>
    `;
    
    // Show shop receipt modal using the enhanced function
    showModal(shopReceiptModal);
    
    console.log('Shop receipt displayed successfully');
}

    // Promo code functionality
    function applyPromoCode() {
        const promoCode = shopPromoCodeInput ? shopPromoCodeInput.value.trim() : '';
        if (!promoCode) {
            showNotification('Please enter a promo code', 'warning');
            return;
        }
        
        // Simple promo code logic (you can expand this)
        const promoCodes = {
            'SAVE10': 0.10,
            'WELCOME': 0.15,
            'FIRST20': 0.20
        };
        
        if (promoCodes[promoCode.toUpperCase()]) {
            const discount = promoCodes[promoCode.toUpperCase()];
            const subtotal = shopCart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
            const discountAmount = subtotal * discount;
            const newTotal = subtotal - discountAmount;
            
            if (shopTotalElement) {
                shopTotalElement.textContent = newTotal.toFixed(2);
                shopTotalElement.innerHTML += ` <small>(${(discount * 100)}% off applied)</small>`;
            }
            
            showNotification(`Promo code applied! You saved ₹${discountAmount.toFixed(2)}`, 'success');
        } else {
            showNotification('Invalid promo code', 'error');
        }
    }

    // Filter links in shop section (using shop-specific filters)
    const shopFilterLinks = document.querySelectorAll('#shop .filters .filter-link');
    shopFilterLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const category = link.getAttribute('data-category').toLowerCase();
            
            // Update active filter
            shopFilterLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            showProductsByCategory(category);
        });
    });

    // Event listeners for promo and checkout buttons
    if (shopApplyPromoBtn) {
        shopApplyPromoBtn.addEventListener('click', applyPromoCode);
    }

    // Initialize enhanced checkout
    enhancedShopCheckout();

    // Fetch products on load
    fetchProducts();
}

// ========================================
// RESERVATION FORM FUNCTIONALITY
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('reservationForm');
    const steps = document.querySelectorAll('.ir-form-step');
    const progressSteps = document.querySelectorAll('.ir-progress-step');
    const nextButtons = document.querySelectorAll('.ir-next-button');
    const prevButtons = document.querySelectorAll('.ir-prev-button');
    const slider = document.getElementById('guests');
    const sliderValue = document.querySelector('.ir-slider-value');
    const congratulationsDiv = document.getElementById('congratulations');
    const receiptDiv = document.getElementById('reservation-receipt'); // FIXED: Changed from 'receipt' to 'reservation-receipt'

    let currentStep = 0;

    // Update slider value display
    if (slider && sliderValue) {
        slider.addEventListener('input', () => {
            sliderValue.textContent = slider.value;
        });
    }

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
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Validate all steps before submission
            if (!validateForm()) {
                showNotification('Please fill out all required fields.', 'error');
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
                credentials: 'include'
            })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        // Hide the form
                        form.classList.add('hidden');

                        // Show the congratulations section
                        if (congratulationsDiv) congratulationsDiv.classList.remove('hidden');

                        // Populate receipt details if elements exist
                        const receiptElements = {
                            'receiptDate': data.date,
                            'receiptTime': data.time,
                            'receiptGuests': data.guests,
                            'receiptName': data.name,
                            'receiptContact': data.contact,
                            'receiptEmail': data.email,
                            'receiptSeating': data.seating,
                            'receiptSpecialRequests': data.specialRequests || 'None',
                            'receiptConfirmationMethod': data.confirmationMethod,
                            'receiptTable': data.tableId ? `Table ID: ${data.tableId}` : 'Will be assigned'
                        };

                        Object.entries(receiptElements).forEach(([id, value]) => {
                            const element = document.getElementById(id);
                            if (element) element.textContent = value;
                        });

                        // Show the receipt section
                        if (receiptDiv) receiptDiv.classList.remove('hidden');

                        // Trigger confetti if available
                        if (typeof confetti !== 'undefined') {
                            confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 }
                            });
                        }

                        showNotification('Reservation submitted successfully!', 'success');
                    } else {
                        showNotification('Error: ' + result.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('An error occurred. Please try again.', 'error');
                });
        });
    }

    // Print receipt button
    const printReceiptButton = document.getElementById('printReceiptButton');
    if (printReceiptButton) {
        printReceiptButton.addEventListener('click', () => {
            window.print();
        });
    }
});

// ========================================
// TESTIMONIALS FUNCTIONALITY
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const testimonialsCarousel = document.querySelector('.testimonials-carousel');
    const leaveReviewBtn = document.getElementById('leave-review-btn');
    const reviewFormContainer = document.getElementById('review-form-container');
    const reviewForm = document.getElementById('review-form');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    
    let carouselTrack;
    let currentIndex = 0;

    // Initialize carousel track
    if (testimonialsCarousel) {
        carouselTrack = testimonialsCarousel.querySelector('.carousel-track');
        if (!carouselTrack) {
            carouselTrack = document.createElement('div');
            carouselTrack.className = 'carousel-track';
            testimonialsCarousel.appendChild(carouselTrack);
        }
    }

    // Function to fetch testimonials and display them in the carousel
    function fetchTestimonials() {
        if (!carouselTrack) return;
        
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
                        <p>Rating: ${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}</p>
                        <p>${testimonial.review}</p>
                    `;
                    carouselTrack.appendChild(testimonialCard);
                });
                updateCarousel();
            })
            .catch(error => {
                console.error('Error fetching testimonials:', error);
                showNotification('Failed to load testimonials', 'error');
            });
    }

    // Function to update the carousel position
    function updateCarousel() {
        if (!testimonialsCarousel || !carouselTrack) return;
        
        const cardWidth = testimonialsCarousel.offsetWidth;
        carouselTrack.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }

    // Function to move to the next testimonial
    function nextTestimonial() {
        if (!carouselTrack) return;
        
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
        if (!carouselTrack) return;
        
        const totalCards = carouselTrack.children.length;
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = totalCards - 1;
        }
        updateCarousel();
    }

    // Show the review form when the "Leave a Review" button is clicked
    if (leaveReviewBtn && reviewFormContainer) {
        leaveReviewBtn.addEventListener('click', () => {
            reviewFormContainer.style.display = 'block';
        });
    }

    // Handle review form submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(event) {
            event.preventDefault();
        
            const formData = new FormData(reviewForm);
            const reviewData = {
                name: formData.get('name'),
                role: formData.get('role'),
                rating: parseInt(formData.get('rating')),
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
                    showNotification('Review submitted successfully!', 'success');
                    reviewForm.reset();
                    if (reviewFormContainer) reviewFormContainer.style.display = 'none';
                    fetchTestimonials(); // Refresh the testimonials
                } else {
                    showNotification('Failed to submit review. Please try again.', 'error');
                }
            })
            .catch(error => {
                console.error('Error submitting review:', error);
                showNotification('Error submitting review. Please try again.', 'error');
            });
        });
    }

    // Add event listeners for next and previous buttons
    if (nextBtn) {
        nextBtn.addEventListener('click', nextTestimonial);
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', prevTestimonial);
    }

    // Fetch testimonials on page load
    fetchTestimonials();
});

// ========================================
// CUSTOMER ACTIVITY TRACKING CODE
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

// Enhanced cart functionality with tracking
function updateCartDisplayWithTracking() {
    updateCartDisplay(); // Call existing function
    
    // Track cart view
    if (cart.length > 0) {
        trackActivity('cart_add', {
            cartItems: cart.length,
            cartValue: cart.reduce((sum, item) => sum + parseFloat(item.price.replace('Rs.', '').replace('₹', '')), 0)
        });
    }
}

// ========================================
// DEBUG AND TESTING FUNCTIONS
// ========================================

// Debug function to check order system
function debugOrderSystem() {
    console.log('=== ORDER SYSTEM DEBUG ===');
    console.log('Cart:', cart);
    console.log('Shop Cart:', typeof shopCart !== 'undefined' ? shopCart : 'Not defined');
    console.log('Order button:', !!document.getElementById('order-now'));
    console.log('Order modal:', !!document.getElementById('order-confirmation-modal'));
    console.log('Receipt modal:', !!document.getElementById('receipt'));
    console.log('Shop checkout btn:', !!document.getElementById('shop-checkout-btn'));
    console.log('Shop receipt modal:', !!document.getElementById('shop-receipt-modal'));
    console.log('========================');
}

// Test function to add items to cart
function addTestItemsToCart() {
    const testItems = [
        { name: 'Paneer Butter Masala', price: '₹250.00' },
        { name: 'Garlic Naan', price: '₹50.00' },
        { name: 'Dal Makhani', price: '₹180.00' }
    ];
    
    cart.push(...testItems);
    updateCartDisplay();
    
    console.log('✅ Added test items to cart:', testItems);
    showNotification('Test items added to cart!', 'success');
    
    return cart;
}

// Make debug functions globally available
window.debugOrderSystem = debugOrderSystem;
window.addTestItemsToCart = addTestItemsToCart;

// ========================================
// SIDEBAR AND PAGE LAYOUT (MENU SECTION)
// ========================================

function initializeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const menuSection = document.getElementById('menu');
    const reservationSection = document.getElementById('reservation');

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

// ========================================
// MAIN INITIALIZATION (DOM LOADED) - UPDATED
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('Restaurant website initialized');
    
    // Track page view
    trackPageView();
    
    // Initialize Menu Section with enhanced error handling
    try {
        fetchAndRenderMenuItems();
        initializeClearCart();
        initializeSidebar();
        initializeOrderFunctionality();
        console.log('Menu section initialized successfully');
    } catch (error) {
        console.error('Error initializing menu section:', error);
        showNotification('Failed to initialize menu section', 'error');
    }

    // Initialize Shop Section with enhanced error handling
    try {
        initializeShopSection();
        console.log('Shop section initialized successfully');
    } catch (error) {
        console.error('Error initializing shop section:', error);
        showNotification('Failed to initialize shop section', 'error');
    }
    
    // Initialize utility functions
    try {
        initializeCartToggle();
        console.log('Utility functions initialized successfully');
    } catch (error) {
        console.error('Error initializing utilities:', error);
    }
    
    // Add CSS animations for notifications
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 5px;
                margin-left: 10px;
            }
            
            .notification-close:hover {
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Show welcome message
    setTimeout(() => {
        showNotification('Welcome to Spice Symphony! Browse our menu and add items to your cart.', 'info', 5000);
    }, 1000);
    
    // Auto-run debug check
    setTimeout(() => {
        console.log('\n🔍 Running automatic system check...');
        debugOrderSystem();
    }, 3000);
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

// Track when user becomes active/inactive
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        trackActivity('page_hidden', { timestamp: new Date().toISOString() });
    } else {
        trackActivity('page_visible', { timestamp: new Date().toISOString() });
    }
});


// ========================================
// ENHANCED EVENT LISTENERS
// ========================================

// Enhanced close modal functionality
document.addEventListener('DOMContentLoaded', function() {
    // Close button event listeners
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close') || e.target.closest('.close')) {
            e.preventDefault();
            console.log('Close button clicked');
            hideAllModals();
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modals = [
            document.getElementById('order-confirmation-modal'),
            document.getElementById('receipt'),
            document.getElementById('shop-receipt-modal')
        ];
        
        modals.forEach(modal => {
            if (modal && e.target === modal) {
                hideModal(modal);
            }
        });
    });

    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllModals();
        }
    });

    // Add debugging function to check modal state
    window.debugModals = function() {
        console.log('=== MODAL DEBUG ===');
        const modalIds = ['order-confirmation-modal', 'receipt', 'shop-receipt-modal'];
        modalIds.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) {
                console.log(`${id}:`, {
                    exists: !!modal,
                    display: modal.style.display,
                    visibility: modal.style.visibility,
                    opacity: modal.style.opacity
                });
            } else {
                console.log(`${id}: NOT FOUND`);
            }
        });
        console.log('Body overflow:', document.body.style.overflow);
        console.log('=================');
    };

    // Force restore scrolling function for emergencies
    window.forceRestoreScrolling = function() {
        document.body.style.overflow = 'auto';
        document.body.style.overflowY = 'auto';
        document.documentElement.style.overflow = 'auto';
        console.log('Scrolling forcefully restored!');
    };
});

// ========================================
// PAGE VISIBILITY HANDLER
// ========================================

// Restore scrolling when page becomes visible (in case user switches tabs)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Check if any modals are actually visible
        const modalIds = ['order-confirmation-modal', 'receipt', 'shop-receipt-modal'];
        const hasVisibleModal = modalIds.some(id => {
            const modal = document.getElementById(id);
            return modal && modal.style.display === 'block';
        });
        
        // If no modals are visible, restore scrolling
        if (!hasVisibleModal) {
            document.body.style.overflow = 'auto';
        }
    }
});

