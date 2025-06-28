// Table Visualization and Selection for Real-Time Availability
class TableMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Table map container not found:', containerId);
            return;
        }
        
        console.log('Initializing TableMap with container:', containerId);
        this.tables = [];
        this.selectedTable = null;
        this.canvas = null;
        this.ctx = null;
        this.scale = 1;
        this.panOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.loadingOverlay = null;
        
        // Create container for loading overlay and messages
        this.setupContainer();
        
        // Initialize canvas
        this.initCanvas();
        
        // Add event listeners
        this.addEventListeners();
    }
    
    setupContainer() {
        // Clear container first
        this.container.innerHTML = '';
        
        // Create canvas container (to hold the actual canvas)
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.className = 'canvas-container';
        this.canvasContainer.style.width = '100%';
        this.canvasContainer.style.height = '100%';
        this.canvasContainer.style.position = 'relative';
        this.container.appendChild(this.canvasContainer);
        
        // Create loading overlay (initially hidden)
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay';
        this.loadingOverlay.style.position = 'absolute';
        this.loadingOverlay.style.top = '0';
        this.loadingOverlay.style.left = '0';
        this.loadingOverlay.style.width = '100%';
        this.loadingOverlay.style.height = '100%';
        this.loadingOverlay.style.display = 'none';
        this.loadingOverlay.style.backgroundColor = 'rgba(245, 245, 245, 0.8)';
        this.loadingOverlay.style.zIndex = '10';
        this.loadingOverlay.style.display = 'flex';
        this.loadingOverlay.style.alignItems = 'center';
        this.loadingOverlay.style.justifyContent = 'center';
        this.loadingOverlay.innerHTML = '<div class="loading-spinner">Loading available tables...</div>';
        this.container.appendChild(this.loadingOverlay);
        
        // Create message container for errors/no tables
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'message-container';
        this.messageContainer.style.position = 'absolute';
        this.messageContainer.style.top = '0';
        this.messageContainer.style.left = '0';
        this.messageContainer.style.width = '100%';
        this.messageContainer.style.height = '100%';
        this.messageContainer.style.display = 'none';
        this.messageContainer.style.backgroundColor = '#f5f5f5';
        this.messageContainer.style.zIndex = '5';
        this.messageContainer.style.display = 'flex';
        this.messageContainer.style.alignItems = 'center';
        this.messageContainer.style.justifyContent = 'center';
        this.container.appendChild(this.messageContainer);
        
        // Hide the loading overlay initially
        this.loadingOverlay.style.display = 'none';
        // Hide the message container initially
        this.messageContainer.style.display = 'none';
    }
    
    initCanvas() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'block'; // Make sure it's visible
        this.canvasContainer.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Initial rendering
        this.render();
        console.log('Canvas initialized successfully');
    }
    
    resizeCanvas() {
        const containerRect = this.container.getBoundingClientRect();
        this.canvas.width = containerRect.width;
        this.canvas.height = containerRect.height;
        console.log('Canvas resized to:', this.canvas.width, 'x', this.canvas.height);
    }
    
    loadTables(date, time, guests) {
        // Show loading state
        this.showLoading(true);
        
        console.log('Loading tables with params:', { date, time, guests });
        
        // Fetch available tables from the server
        fetch(`/api/tables/availability?date=${date}&time=${time}&guests=${guests}`)
            .then(response => {
                console.log('API response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('API data received:', data);
                
                if (data.success) {
                    this.tables = data.availableTables;
                    
                    // If no tables are available, show message
                    if (this.tables.length === 0) {
                        console.log('No tables available for the selected criteria');
                        this.showNoTablesMessage();
                    } else {
                        console.log('Found', this.tables.length, 'available tables');
                        // Hide loading and messages
                        this.showLoading(false);
                        this.showMessage(false);
                        
                        // Render tables on canvas
                        this.resizeCanvas(); // Make sure canvas has right dimensions
                        this.render();
                        
                        // Update availability message
                        this.updateAvailabilityMessage(data.availableTables.length, data.guests);
                    }
                } else {
                    console.error('API returned error:', data.message);
                    this.showErrorMessage(data.message || 'Failed to load table availability.');
                }
            })
            .catch(error => {
                console.error('Error loading tables:', error);
                this.showErrorMessage('An error occurred while loading table availability.');
            });
    }
    
    showLoading(show) {
        if (show) {
            console.log('Showing loading overlay');
            // Show loading overlay, hide the message container
            this.loadingOverlay.style.display = 'flex';
            this.messageContainer.style.display = 'none';
        } else {
            console.log('Hiding loading overlay');
            // Hide loading overlay
            this.loadingOverlay.style.display = 'none';
        }
    }
    
    showMessage(show, content = '') {
        if (show) {
            // Show message container, hide loading
            this.messageContainer.style.display = 'flex';
            this.messageContainer.innerHTML = content;
            this.loadingOverlay.style.display = 'none';
        } else {
            // Hide message container
            this.messageContainer.style.display = 'none';
        }
    }
    
    showNoTablesMessage() {
        console.log('Showing no tables message');
        const message = `
            <div class="no-tables-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>No Tables Available</h3>
                <p>We're sorry, there are no tables available for the selected date, time, and party size.</p>
                <p>Please try a different time or date.</p>
            </div>
        `;
        this.showMessage(true, message);
    }
    
    showErrorMessage(message) {
        console.error('Showing error message:', message);
        const errorHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
        this.showMessage(true, errorHTML);
    }
    
    updateAvailabilityMessage(tableCount, guestCount) {
        const messageContainer = document.getElementById('availability-message');
        if (messageContainer) {
            console.log('Updating availability message:', tableCount, 'tables for', guestCount, 'guests');
            messageContainer.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <p>We found ${tableCount} available ${tableCount === 1 ? 'table' : 'tables'} for ${guestCount} guests.</p>
                    <p>Please select a table on the map below.</p>
                </div>
            `;
        }
    }
    
    render() {
        if (!this.ctx || !this.canvas) {
            console.error('Cannot render: context or canvas is null');
            return;
        }
        
        console.log('Rendering tables:', this.tables.length);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw restaurant layout background
        this.drawBackground();
        
        // Draw tables
        this.tables.forEach(table => {
            this.drawTable(table);
        });
    }
    
    drawBackground() {
        // Draw simple restaurant layout
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sections (indoor/outdoor)
        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.fillRect(0, 0, this.canvas.width * 0.7, this.canvas.height); // Indoor area
        
        this.ctx.fillStyle = '#c8e6c9';
        this.ctx.fillRect(this.canvas.width * 0.7, 0, this.canvas.width * 0.3, this.canvas.height); // Outdoor area
        
        // Draw section labels
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Indoor Seating', this.canvas.width * 0.35, 30);
        this.ctx.fillText('Outdoor Seating', this.canvas.width * 0.85, 30);
        
        // Draw divider
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width * 0.7, 0);
        this.ctx.lineTo(this.canvas.width * 0.7, this.canvas.height);
        this.ctx.strokeStyle = '#888';
        this.ctx.stroke();
    }
    
    drawTable(table) {
        const { id, table_number, capacity, section, status, coordinates_x, coordinates_y } = table;
        
        // Calculate position with scaling and panning
        const x = coordinates_x * this.scale + this.panOffset.x;
        const y = coordinates_y * this.scale + this.panOffset.y;
        
        // Table shape based on capacity
        let tableRadius;
        if (capacity <= 2) {
            tableRadius = 20;
        } else if (capacity <= 4) {
            tableRadius = 30;
        } else if (capacity <= 6) {
            tableRadius = 40;
        } else {
            tableRadius = 50;
        }
        
        // Draw table
        this.ctx.beginPath();
        
        // Shape based on section
        if (section === 'indoor') {
            // Square table for indoor
            this.ctx.rect(x - tableRadius, y - tableRadius, tableRadius * 2, tableRadius * 2);
        } else {
            // Round table for outdoor
            this.ctx.arc(x, y, tableRadius, 0, Math.PI * 2);
        }
        
        // Fill based on selection state
        if (this.selectedTable && this.selectedTable.id === id) {
            this.ctx.fillStyle = '#4caf50'; // Green for selected
        } else {
            this.ctx.fillStyle = '#ffffff'; // White for available
        }
        
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#333';
        this.ctx.stroke();
        
        // Draw table number and capacity
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(table_number, x, y - 7);
        this.ctx.fillText(`(${capacity})`, x, y + 10);
    }
    
    addEventListeners() {
        if (!this.canvas) {
            console.error('Cannot add event listeners: canvas is null');
            return;
        }
        
        // Mouse events for table selection
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        
        // Zoom and pan events
        this.canvas.addEventListener('wheel', this.handleZoom.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });
        
        console.log('Event listeners added successfully');
    }
    
    handleCanvasClick(event) {
        // Get click position
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
        
        console.log('Canvas click at:', x, y);
        
        // Check if a table was clicked
        let clickedTable = null;
        for (const table of this.tables) {
            // Convert table coordinates with scale and offset
            const tableX = table.coordinates_x * this.scale + this.panOffset.x;
            const tableY = table.coordinates_y * this.scale + this.panOffset.y;
            
            // Determine table radius based on capacity
            let tableRadius;
            if (table.capacity <= 2) {
                tableRadius = 20;
            } else if (table.capacity <= 4) {
                tableRadius = 30;
            } else if (table.capacity <= 6) {
                tableRadius = 40;
            } else {
                tableRadius = 50;
            }
            
            // Check if click is within table bounds
            if (table.section === 'indoor') {
                // Square table
                if (
                    x >= tableX - tableRadius &&
                    x <= tableX + tableRadius &&
                    y >= tableY - tableRadius &&
                    y <= tableY + tableRadius
                ) {
                    clickedTable = table;
                    break;
                }
            } else {
                // Round table
                const distance = Math.sqrt(Math.pow(x - tableX, 2) + Math.pow(y - tableY, 2));
                if (distance <= tableRadius) {
                    clickedTable = table;
                    break;
                }
            }
        }
        
        // Handle table selection
        if (clickedTable) {
            console.log('Table selected:', clickedTable.table_number);
            this.selectTable(clickedTable);
        } else {
            console.log('No table selected');
            this.clearSelection();
        }
    }
    
    selectTable(table) {
        // Update selected table
        this.selectedTable = table;
        
        // Update UI to show selected table
        this.render();
        
        // Update form hidden input
        const tableIdInput = document.getElementById('tableId');
        if (tableIdInput) {
            tableIdInput.value = table.id;
        }
        
        // Update table information display
        this.updateTableInfo(table);
        
        // Enable submit button if it was disabled
        const submitButton = document.querySelector('.ir-submit-button');
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
    
    clearSelection() {
        this.selectedTable = null;
        this.render();
        
        // Clear form hidden input
        const tableIdInput = document.getElementById('tableId');
        if (tableIdInput) {
            tableIdInput.value = '';
        }
        
        // Clear table information display
        this.updateTableInfo(null);
    }
    
    updateTableInfo(table) {
        const tableInfoContainer = document.getElementById('selected-table-info');
        if (tableInfoContainer) {
            if (table) {
                tableInfoContainer.innerHTML = `
                    <div class="selected-table">
                        <h4>Selected Table</h4>
                        <p><strong>Table Number:</strong> ${table.table_number}</p>
                        <p><strong>Capacity:</strong> ${table.capacity} guests</p>
                        <p><strong>Section:</strong> ${table.section === 'indoor' ? 'Indoor' : 'Outdoor'}</p>
                    </div>
                `;
                tableInfoContainer.style.display = 'block';
            } else {
                tableInfoContainer.innerHTML = '';
                tableInfoContainer.style.display = 'none';
            }
        }
    }
    
    handleZoom(event) {
        event.preventDefault();
        
        // Determine zoom direction
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        
        // Get mouse position
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        const mouseY = (event.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Calculate new scale
        const newScale = this.scale * zoomFactor;
        
        // Limit zoom
        if (newScale < 0.5 || newScale > 3) return;
        
        // Calculate offset to zoom around mouse position
        this.panOffset.x = mouseX - (mouseX - this.panOffset.x) * zoomFactor;
        this.panOffset.y = mouseY - (mouseY - this.panOffset.y) * zoomFactor;
        
        // Update scale
        this.scale = newScale;
        
        // Render with new scale
        this.render();
    }
    
    handleMouseDown(event) {
        this.isDragging = true;
        this.lastMousePos = {
            x: event.clientX,
            y: event.clientY
        };
    }
    
    handleMouseMove(event) {
        if (!this.isDragging) return;
        
        // Calculate pan distance
        const dx = event.clientX - this.lastMousePos.x;
        const dy = event.clientY - this.lastMousePos.y;
        
        // Update pan offset
        this.panOffset.x += dx;
        this.panOffset.y += dy;
        
        // Update last mouse position
        this.lastMousePos = {
            x: event.clientX,
            y: event.clientY
        };
        
        // Render with new pan
        this.render();
    }
    
    handleMouseUp() {
        this.isDragging = false;
    }
}

// Initialize the table map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing table visualization');
    
    // Initialize with step change monitoring
    initializeTableVisualization();
    
    // Also initialize step change monitoring if not already set up
    setupStepChangeMonitoring();
});

// Main initialization function that can be called repeatedly without duplication
function initializeTableVisualization() {
    console.log('Initializing table visualization');
    
    // Create table map instance if container exists
    const tableMapContainer = document.getElementById('table-map-container');
    if (tableMapContainer) {
        console.log('Table map container found, creating TableMap instance');
        
        // Only create a new instance if one doesn't already exist
        if (!window.tableMap) {
            window.tableMap = new TableMap('table-map-container');
            
            // Check if reservation form exists and set up the integration
            const reservationForm = document.getElementById('reservationForm');
            if (reservationForm) {
                console.log('Reservation form found, setting up integration');
                setupTableReservationIntegration();
            }
        } else {
            console.log('TableMap already exists, skipping initialization');
        }
    } else {
        console.log('Table map container not found yet');
    }
}

// Set up integration with reservation form
function setupTableReservationIntegration() {
    // Add event listeners for form inputs
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const guestsInput = document.getElementById('guests');
    
    if (dateInput && timeInput && guestsInput) {
        console.log('Found form inputs, setting up event listeners');
        
        // Add event listeners to update table availability
        dateInput.addEventListener('change', updateTableAvailability);
        timeInput.addEventListener('change', updateTableAvailability);
        guestsInput.addEventListener('input', updateTableAvailability);
        
        // Add a hidden input for selected table if it doesn't exist
        if (!document.getElementById('tableId')) {
            console.log('Adding hidden tableId input to form');
            const tableIdInput = document.createElement('input');
            tableIdInput.type = 'hidden';
            tableIdInput.id = 'tableId';
            tableIdInput.name = 'tableId';
            document.getElementById('reservationForm').appendChild(tableIdInput);
        }
    }
}

// Update table availability based on form inputs
function updateTableAvailability() {
    console.log('updateTableAvailability called');
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const guests = document.getElementById('guests').value;
    
    // Validate inputs
    if (!date || !time || !guests) {
        console.log('Missing required inputs for table availability:', { date, time, guests });
        return;
    }
    
    console.log('Updating table availability with:', { date, time, guests });
    
    // Update table map
    if (window.tableMap) {
        window.tableMap.loadTables(date, time, guests);
    } else {
        console.error('tableMap is not initialized');
    }
}

// Monitor step changes to initialize table map when reaching step 4
function setupStepChangeMonitoring() {
    console.log('Setting up step change monitoring');
    
    // Find all step navigation buttons
    const nextButtons = document.querySelectorAll('.ir-next-button');
    const prevButtons = document.querySelectorAll('.ir-prev-button');
    
    // Monitor next button clicks to check when we reach step 4
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Next button clicked');
            setTimeout(() => {
                // Find the active step
                const activeStep = document.querySelector('.ir-form-step.active');
                if (activeStep && activeStep.getAttribute('data-step') === '4') {
                    console.log('Reached step 4, triggering table initialization');
                    
                    // Ensure table map is initialized
                    initializeTableVisualization();
                    
                    // Try to update table availability with current form values
                    updateTableAvailability();
                }
            }, 100); // Small delay to ensure DOM is updated
        });
    });
    
    // Also check when back button is clicked and we might return to step 4
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Previous button clicked');
            setTimeout(() => {
                // Find the active step
                const activeStep = document.querySelector('.ir-form-step.active');
                if (activeStep && activeStep.getAttribute('data-step') === '4') {
                    console.log('Returned to step 4, triggering table initialization');
                    
                    // Ensure table map is initialized
                    initializeTableVisualization();
                    
                    // Try to update table availability with current form values
                    updateTableAvailability();
                }
            }, 100); // Small delay to ensure DOM is updated
        });
    });
}

// Function to manually render test tables for debugging
window.addTestTables = function() {
    console.log('Adding test tables for debugging');
    
    if (window.tableMap) {
        // Table data matching your database
        window.tableMap.tables = [
            {
                id: 1,
                table_number: "A1",
                capacity: 2,
                section: "indoor",
                status: "available",
                coordinates_x: 100,
                coordinates_y: 100
            },
            {
                id: 2,
                table_number: "A2",
                capacity: 2,
                section: "indoor",
                status: "available",
                coordinates_x: 100,
                coordinates_y: 200
            },
            {
                id: 3,
                table_number: "A3",
                capacity: 4,
                section: "indoor",
                status: "available",
                coordinates_x: 100,
                coordinates_y: 300
            },
            {
                id: 4,
                table_number: "A4",
                capacity: 4,
                section: "indoor",
                status: "available",
                coordinates_x: 100,
                coordinates_y: 400
            },
            {
                id: 5,
                table_number: "B1",
                capacity: 4,
                section: "indoor",
                status: "available",
                coordinates_x: 200,
                coordinates_y: 100
            },
            {
                id: 6,
                table_number: "B2",
                capacity: 4,
                section: "indoor",
                status: "available",
                coordinates_x: 200,
                coordinates_y: 200
            },
            {
                id: 7,
                table_number: "B3",
                capacity: 6,
                section: "indoor",
                status: "available",
                coordinates_x: 200,
                coordinates_y: 300
            },
            {
                id: 8,
                table_number: "B4",
                capacity: 6,
                section: "indoor",
                status: "available",
                coordinates_x: 200,
                coordinates_y: 400
            },
            {
                id: 9,
                table_number: "C1",
                capacity: 2,
                section: "outdoor",
                status: "available",
                coordinates_x: 300,
                coordinates_y: 100
            },
            {
                id: 10,
                table_number: "C2",
                capacity: 4,
                section: "outdoor",
                status: "available",
                coordinates_x: 300,
                coordinates_y: 200
            },
            {
                id: 11,
                table_number: "C3",
                capacity: 6,
                section: "outdoor",
                status: "available",
                coordinates_x: 300,
                coordinates_y: 300
            },
            {
                id: 12,
                table_number: "C4",
                capacity: 8,
                section: "outdoor",
                status: "available",
                coordinates_x: 300,
                coordinates_y: 400
            }
        ];
        
        // Update availability message
        const availabilityMessage = document.getElementById('availability-message');
        if (availabilityMessage) {
            availabilityMessage.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <p>We found 12 available tables for your party.</p>
                    <p>Please select a table on the map below.</p>
                </div>
            `;
        }
        
        // Show canvas, hide message and loading
        if (window.tableMap.messageContainer) {
            window.tableMap.messageContainer.style.display = 'none';
        }
        if (window.tableMap.loadingOverlay) {
            window.tableMap.loadingOverlay.style.display = 'none';
        }
        
        // Make sure canvas is properly sized
        window.tableMap.resizeCanvas();
        window.tableMap.render();
    }
};