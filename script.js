// This script handles the dynamic interactions of the form and the PDF generation.
document.addEventListener('DOMContentLoaded', function() {
    
    // --- UI Interaction Logic ---

    // Function to handle toggling visibility of an element based on a radio button selection.
    function setupRadioToggle(radioGroupName, targetElementId, showOnId) {
        const targetElement = document.getElementById(targetElementId);
        if (!targetElement) return;

        document.querySelectorAll(`input[name="${radioGroupName}"]`).forEach(radio => {
            radio.addEventListener('change', event => {
                targetElement.style.display = event.target.id === showOnId ? 'block' : 'none';
            });
        });
    }
    
    // Function to handle toggling visibility of a grid element based on a radio button selection.
    function setupRadioGridToggle(radioGroupName, targetElementId, showOnId) {
        const targetElement = document.getElementById(targetElementId);
        if (!targetElement) return;

        document.querySelectorAll(`input[name="${radioGroupName}"]`).forEach(radio => {
            radio.addEventListener('change', event => {
                targetElement.style.display = event.target.id === showOnId ? 'grid' : 'none';
            });
        });
    }

    // Contractor Type: Show/hide 'other' text input
    setupRadioToggle('contractor-type', 'contractor-type-other-text', 'type-other');

    // Food Provided: Show/hide details input
    setupRadioToggle('food-provided', 'food-details', 'food-yes');
    
    // High-Risk Activity: Show/hide details input
    setupRadioToggle('high-risk-activity', 'risk-details', 'risk-yes');

    // Liability Insurance: Show/hide inputs
    setupRadioGridToggle('liability-insurance', 'liability-inputs', 'liability-needed');

    // Coverage Plan: Enable/disable free plan inputs
    const freePlanInputsContainer = document.getElementById('free-plan-inputs');
    const freePlanInputs = freePlanInputsContainer.querySelectorAll('input');
    const planRadios = document.querySelectorAll('input[name="coverage-plan"]');

    function toggleFreePlanInputs() {
        const isFreePlanSelected = document.getElementById('plan-free').checked;
        freePlanInputs.forEach(input => {
            input.disabled = !isFreePlanSelected;
        });
        freePlanInputsContainer.style.opacity = isFreePlanSelected ? '1' : '0.5';
        if (!isFreePlanSelected) {
             freePlanInputs.forEach(input => input.value = ''); // Clear values when disabled
        }
    }
    planRadios.forEach(radio => radio.addEventListener('change', toggleFreePlanInputs));
    toggleFreePlanInputs(); // Initial state setup

    // --- PDF Generation Logic ---
    const generatePdfButton = document.getElementById('generate-pdf');
    const formContainer = document.getElementById('main-form');
    const loadingOverlay = document.getElementById('loading-overlay');

    generatePdfButton.addEventListener('click', () => {
        // Basic validation check
        const contactPerson = document.getElementById('contact-person').value;
        const eventName = document.getElementById('event-name').value;
        if (!contactPerson || !eventName) {
            alert('「ご担当者様名」と「イベント名称」は必須項目です。');
            return;
        }
    
        loadingOverlay.style.display = 'flex';
        
        // Temporarily remove shadows for better PDF rendering
        const elementsWithShadow = document.querySelectorAll('.form-section, .btn-pdf, .plan-card');
        elementsWithShadow.forEach(el => el.style.boxShadow = 'none');
        
        window.scrollTo(0,0);

        html2canvas(formContainer, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false,
            onclone: (clonedDoc) => {
                // In the cloned document, ensure all inputs, textareas, and selects show their values for rendering
                const originalElements = formContainer.querySelectorAll('input, textarea, select');
                const clonedElements = clonedDoc.querySelectorAll('input, textarea, select');

                for (let i = 0; i < originalElements.length; i++) {
                    const original = originalElements[i];
                    const clone = clonedElements[i];

                    // Set value for text-based inputs and textareas
                    if (clone.type !== 'radio' && clone.type !== 'checkbox') {
                         clone.value = original.value;
                    }
                    if(clone.tagName.toLowerCase() === 'textarea'){
                        clone.textContent = original.value;
                    }

                    // Set checked state for radios and checkboxes
                    if (original.type === 'radio' || original.type === 'checkbox') {
                        if (original.checked) {
                            clone.setAttribute('checked', 'checked');
                        } else {
                            clone.removeAttribute('checked');
                        }
                    }
                    
                    // Set selected state for select options
                    if (original.tagName.toLowerCase() === 'select') {
                        const selectedOption = original.querySelector('option:checked');
                        if (selectedOption) {
                            const cloneOption = clone.querySelector(`option[value="${selectedOption.value}"]`);
                            if(cloneOption) cloneOption.setAttribute('selected', 'selected');
                        }
                    }
                }
            }
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            
            // Calculate PDF dimensions to maintain aspect ratio
            const pdfWidth = 595; // A4 width in points
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'pt',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('レクリエーション保険ヒアリングシート.pdf');
            
        }).catch(err => {
            console.error("PDF generation failed:", err);
            alert("PDFの生成に失敗しました。");
        }).finally(() => {
            // Restore styles and hide overlay
            elementsWithShadow.forEach(el => el.style.boxShadow = '');
            loadingOverlay.style.display = 'none';
        });
    });
});
