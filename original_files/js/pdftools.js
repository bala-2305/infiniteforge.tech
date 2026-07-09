document.addEventListener('DOMContentLoaded', () => {
            const { PDFDocument, rgb } = PDFLib;
            const { saveAs } = FileSaver;

            // pdf.js worker
            if (window.pdfjsLib) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';
            }

            // Mobile menu toggle
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });

            // Close mobile menu when a link is clicked
            const mobileMenuLinks = mobileMenu.querySelectorAll('a');
            mobileMenuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                });
            });

            // Close mobile menu when scrolling
            window.addEventListener('scroll', () => {
                if (!mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            });



            // Tab functionality
            const tabs = document.querySelectorAll('.tab-button');
            const panels = document.querySelectorAll('.tab-panel');

            // Function to set active tab
            function setActiveTab(activeTab) {
                // Reset all tabs to inactive state
                tabs.forEach(t => {
                    t.classList.remove('tab-active', 'text-blue-700', 'bg-blue-50/80', 'border-blue-500');
                    t.classList.add('text-gray-600', 'hover:text-gray-800');
                    // Remove blue border
                    t.style.borderBottomColor = 'transparent';
                    t.style.backgroundColor = '';
                });

                // Hide all panels
                panels.forEach(p => p.classList.add('hidden'));

                // Set active tab
                activeTab.classList.add('tab-active', 'text-blue-700', 'bg-blue-50/80');
                activeTab.classList.remove('text-gray-600', 'hover:text-gray-800');
                activeTab.style.borderBottomColor = '#3b82f6';
                activeTab.style.backgroundColor = 'rgba(239, 246, 255, 0.8)';

                // Show corresponding panel
                const target = activeTab.getAttribute('data-target');
                const targetPanel = document.getElementById(target);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden');
                }
            }

            // Set initial active tab (Merge PDFs)
            const initialActiveTab = document.querySelector('.tab-button[data-target="merge"]');
            if (initialActiveTab) {
                setActiveTab(initialActiveTab);
            }

            // Add click handlers
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    setActiveTab(tab);
                });
            });

            feather.replace();

            // --- Helper function to render PDF preview ---
            async function renderPdfPreview(file, canvas) {
                if (!window.pdfjsLib) {
                    console.error("pdf.js is not loaded.");
                    // Fallback: show a simple placeholder if pdf.js is missing
                    const context = canvas.getContext('2d');
                    canvas.width = 200;
                    canvas.height = 280;
                    context.fillStyle = '#f0f0f0';
                    context.fillRect(0, 0, 200, 280);
                    context.fillStyle = '#a0a0a0';
                    context.font = '16px Arial';
                    context.textAlign = 'center';
                    context.fillText('Preview unavailable', 100, 140);
                    return;
                }
                try {
                    const fileReader = new FileReader();
                    fileReader.onload = async function() {
                        const typedarray = new Uint8Array(this.result);
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        const page = await pdf.getPage(1);
                        const viewport = page.getViewport({ scale: 0.4 });

                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        
                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        await page.render(renderContext).promise;
                    };
                    fileReader.readAsArrayBuffer(file);
                } catch (error) {
                    console.error('Error rendering PDF preview:', error);
                    const context = canvas.getContext('2d');
                    canvas.width = 200;
                    canvas.height = 280;
                    context.fillStyle = '#f0f0f0';
                    context.fillRect(0, 0, 200, 280);
                    context.fillStyle = '#d9534f';
                    context.font = '16px Arial';
                    context.textAlign = 'center';
                    context.fillText('Preview Error', 100, 140);
                }
            }

            // --- Merge PDF ---
            const mergeFilesInput = document.getElementById('merge-files');
            const mergeBtn = document.getElementById('merge-btn');
            const mergePreview = document.getElementById('merge-preview');
            let mergeFiles = [];

            function showMergeError(fileContainer, message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 rounded-lg';
                errorDiv.innerHTML = `<p class="text-red-600 text-sm text-center px-2">${message}</p>`;
                fileContainer.appendChild(errorDiv);
            }

            function updateMergeButtonState() {
                const validFiles = mergeFiles.filter(file => file.type === 'application/pdf');
                mergeBtn.disabled = validFiles.length < 2;
                if (validFiles.length < 2) {
                    mergeBtn.title = 'Select at least two valid PDF files to merge';
                } else {
                    mergeBtn.title = 'Click to merge selected PDF files';
                }
            }

            mergeFilesInput.addEventListener('change', async (e) => {
                mergeFiles = Array.from(e.target.files);
                mergePreview.innerHTML = '';
                updateMergeButtonState();
                
                if (mergeFiles.length > 0) {
                    for (const file of mergeFiles) {
                        const fileContainer = document.createElement('div');
                        fileContainer.className = 'relative p-2 border rounded-lg bg-gray-50';
                        const canvas = document.createElement('canvas');
                        canvas.className = 'w-full h-auto rounded-md';
                        const fileName = document.createElement('p');
                        fileName.textContent = file.name;
                        fileName.className = 'text-xs text-center text-gray-600 mt-1 truncate';
                        fileContainer.appendChild(canvas);
                        fileContainer.appendChild(fileName);
                        mergePreview.appendChild(fileContainer);

                        if (file.type !== 'application/pdf') {
                            showMergeError(fileContainer, 'Invalid file type. Please select a PDF file.');
                            continue;
                        }

                        try {
                            await renderPdfPreview(file, canvas);
                        } catch (err) {
                            console.error(`Error previewing ${file.name}:`, err);
                            showMergeError(fileContainer, 'Could not preview this PDF. The file may be corrupted.');
                        }
                    }
                    updateMergeButtonState();
                }
            });

            mergeBtn.addEventListener('click', async () => {
                if (mergeFiles.length < 2) {
                    alert('Please select at least two PDF files to merge.');
                    return;
                }
                if (typeof PDFDocument === 'undefined' || !PDFDocument) {
                    alert('Error: PDF library not loaded. Please refresh the page and try again.');
                    return;
                }

                mergeBtn.disabled = true;
                const progressContainer = document.createElement('div');
                progressContainer.className = 'fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50';
                progressContainer.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <div class="loader"></div>
                        <div>
                            <p class="text-sm font-semibold text-gray-700">Merging PDFs...</p>
                            <p class="text-xs text-gray-600" id="merge-progress">Preparing...</p>
                        </div>
                    </div>
                `;
                document.body.appendChild(progressContainer);
                
                const updateProgress = (message) => {
                    const progressElement = document.getElementById('merge-progress');
                    if (progressElement) {
                        progressElement.textContent = message;
                    }
                };
                
                try {
                    updateProgress('Initializing merge process...');
                    console.log('Creating new PDF document...');
                    const mergedPdf = await PDFDocument.create();
                    
                    for (let i = 0; i < mergeFiles.length; i++) {
                        const file = mergeFiles[i];
                        updateProgress(`Processing file ${i + 1} of ${mergeFiles.length}: ${file.name}`);
                        console.log(`Processing file ${i + 1}/${mergeFiles.length}: ${file.name}`);
                        
                        try {
                            const pdfBytes = await file.arrayBuffer();
                            console.log(`Loading PDF: ${file.name}`);
                            const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                            
                            const pageIndices = pdf.getPageIndices();
                            console.log(`Copying ${pageIndices.length} pages from ${file.name}`);
                            updateProgress(`Copying ${pageIndices.length} pages from ${file.name}`);
                            const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
                            
                            copiedPages.forEach((page, idx) => {
                                mergedPdf.addPage(page);
                                console.log(`Added page ${idx + 1} from ${file.name}`);
                            });
                        } catch (fileErr) {
                            console.error(`Error processing file ${file.name}:`, fileErr);
                            throw new Error(`Failed to process file ${file.name}: ${fileErr.message}`);
                        }
                    }
                    
                    updateProgress('Finalizing merged PDF...');
                    console.log('Saving merged PDF...');
                    const mergedPdfBytes = await mergedPdf.save();
                    console.log('PDF merged successfully, initiating download...');
                    updateProgress('Starting download...');
                    
                    // Try to use FileSaver.js first
                    if (typeof saveAs !== 'undefined') {
                        saveAs(new Blob([mergedPdfBytes], { type: 'application/pdf' }), 'Daedalus_merged.pdf');
                    } else {
                        // Fallback: Use native browser download
                        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = 'Daedalus_merged.pdf';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }
                } catch (err) {
                    console.error('PDF merge error:', err);
                    alert('An error occurred while merging PDFs: ' + err.message);
                } finally {
                    mergeBtn.disabled = false;
                    mergeBtn.innerHTML = '<i data-feather="copy" class="inline-block mr-2"></i>Merge PDFs';
                    feather.replace();
                    const progressContainer = document.querySelector('.fixed.top-4.right-4');
                    if (progressContainer) {
                        progressContainer.remove();
                    }
                }
            });

            // --- Split PDF ---
            const splitFileInput = document.getElementById('split-file');
            const splitOptions = document.getElementById('split-options');
            const splitBtn = document.getElementById('split-btn');
            const splitRangeInput = document.getElementById('split-range');
            const splitPreviewCanvas = document.getElementById('split-preview-canvas');
            let splitFile = null;

            splitFileInput.addEventListener('change', async (e) => {
                splitFile = e.target.files[0];
                if (splitFile) {
                    splitOptions.classList.remove('hidden');
                    await renderPdfPreview(splitFile, splitPreviewCanvas);
                } else {
                    splitOptions.classList.add('hidden');
                }
            });

            splitBtn.addEventListener('click', async () => {
                if (!splitFile) {
                    alert('Please select a PDF file to split.');
                    return;
                }
                const rangeText = splitRangeInput.value;
                if (!rangeText) {
                    alert('Please specify a page range.');
                    return;
                }
                splitBtn.disabled = true;
                splitBtn.innerHTML = '<div class="loader inline-block mr-2"></div>Splitting...';
                try {
                    const pdfBytes = await splitFile.arrayBuffer();
                    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                    const newPdf = await PDFDocument.create();
                    
                    const pageIndices = new Set();
                    const totalPages = pdf.getPageCount();
                    const ranges = rangeText.split(',');
                    ranges.forEach(range => {
                        range = range.trim();
                        if (range.includes('-')) {
                            const [start, end] = range.split('-').map(Number);
                            for (let i = start; i <= end; i++) {
                                if (i > 0 && i <= totalPages) pageIndices.add(i - 1);
                            }
                        } else {
                            const pageNum = Number(range);
                            if (pageNum > 0 && pageNum <= totalPages) pageIndices.add(pageNum - 1);
                        }
                    });

                    if (pageIndices.size === 0) {
                        alert('Invalid page range. Please enter valid page numbers.');
                        splitBtn.disabled = false;
                        splitBtn.innerHTML = '<i data-feather="scissors" class="inline-block mr-2"></i>Split PDF';
                        feather.replace();
                        return;
                    }

                    const sortedIndices = Array.from(pageIndices).sort((a, b) => a - b);
                    const copiedPages = await newPdf.copyPages(pdf, sortedIndices);
                    copiedPages.forEach(page => newPdf.addPage(page));

                    const newPdfBytes = await newPdf.save();
                    
                    if (typeof saveAs !== 'undefined') {
                        saveAs(new Blob([newPdfBytes], { type: 'application/pdf' }), 'Daedalus_split.pdf');
                    } else {
                        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = 'Daedalus_split.pdf';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }
                } catch (err) {
                    alert('An error occurred: ' + err.message);
                } finally {
                    splitBtn.disabled = false;
                    splitBtn.innerHTML = '<i data-feather="scissors" class="inline-block mr-2"></i>Split PDF';
                    feather.replace();
                }
            });

            // --- Image to PDF ---
            const imageFilesInput = document.getElementById('image-files');
            const imageToPdfBtn = document.getElementById('image-to-pdf-btn');
            const imagePreview = document.getElementById('image-preview');
            let imageFiles = [];

            imageFilesInput.addEventListener('change', (e) => {
                imageFiles = Array.from(e.target.files);
                imagePreview.innerHTML = '';
                imageToPdfBtn.disabled = true;
                if (imageFiles.length > 0) {
                    imageToPdfBtn.disabled = false;
                    imageFiles.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const imgContainer = document.createElement('div');
                            imgContainer.className = 'relative p-2 border rounded-lg bg-gray-50';
                            const img = document.createElement('img');
                            img.src = event.target.result;
                            img.className = 'w-full h-auto rounded-md object-contain';
                             const fileName = document.createElement('p');
                            fileName.textContent = file.name;
                            fileName.className = 'text-xs text-center text-gray-600 mt-1 truncate';
                            imgContainer.appendChild(img);
                            imgContainer.appendChild(fileName);
                            imagePreview.appendChild(imgContainer);
                        };
                        reader.readAsDataURL(file);
                    });
                }
            });

            imageToPdfBtn.addEventListener('click', async () => {
                if (imageFiles.length === 0) {
                    alert('Please select at least one image file.');
                    return;
                }
                imageToPdfBtn.disabled = true;
                imageToPdfBtn.innerHTML = '<div class="loader inline-block mr-2"></div>Converting...';
                try {
                    const pdfDoc = await PDFDocument.create();
                    for (const file of imageFiles) {
                        const bytes = await file.arrayBuffer();
                        let image;
                        if (file.type === 'image/jpeg') {
                            image = await pdfDoc.embedJpg(bytes);
                        } else if (file.type === 'image/png') {
                            image = await pdfDoc.embedPng(bytes);
                        } else {
                            continue; // Skip unsupported file types
                        }
                        const page = pdfDoc.addPage([image.width, image.height]);
                        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                    }
                    const pdfBytes = await pdfDoc.save();
                    if (typeof saveAs !== 'undefined') {
                        saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), 'Daedalus_converted.pdf');
                    } else {
                        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = 'Daedalus_converted.pdf';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }
                } catch (err) {
                    alert('An error occurred: ' + err.message);
                } finally {
                    imageToPdfBtn.disabled = false;
                    imageToPdfBtn.innerHTML = '<i data-feather="image" class="inline-block mr-2"></i>Convert to PDF';
                    feather.replace();
                }
            });

            // --- Unlock PDF ---
            const unlockFileInput = document.getElementById('unlock-file');
            const unlockOptions = document.getElementById('unlock-options');
            const unlockBtn = document.getElementById('unlock-btn');
            const unlockPasswordInput = document.getElementById('unlock-password');
            const unlockPreviewCanvas = document.getElementById('unlock-preview-canvas');
            let unlockFile = null;

            unlockFileInput.addEventListener('change', (e) => {
                unlockFile = e.target.files[0];
                if (unlockFile) {
                    unlockOptions.classList.remove('hidden');
                    // Preview for encrypted PDF is tricky, so we just show a placeholder
                    const context = unlockPreviewCanvas.getContext('2d');
                    unlockPreviewCanvas.width = 200;
                    unlockPreviewCanvas.height = 280;
                    context.fillStyle = '#f0f0f0';
                    context.fillRect(0, 0, 200, 280);
                    context.fillStyle = '#a0a0a0';
                    context.font = '16px Arial';
                    context.textAlign = 'center';
                    context.fillText('Encrypted PDF', 100, 140);
                    context.fillText('(Preview not available)', 100, 160);
                } else {
                    unlockOptions.classList.add('hidden');
                }
            });

            unlockBtn.addEventListener('click', async () => {
                if (!unlockFile) {
                    alert('Please select a PDF file to unlock.');
                    return;
                }
                const password = unlockPasswordInput.value;
                if (!password) {
                    alert('Please enter the PDF password.');
                    return;
                }
                unlockBtn.disabled = true;
                unlockBtn.innerHTML = '<div class="loader inline-block mr-2"></div>Unlocking...';
                try {
                    const pdfBytes = await unlockFile.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(pdfBytes, {
                        password: password
                    });
                    // Saving the document without a password effectively removes it.
                    const pdfDocBytes = await pdfDoc.save();
                    if (typeof saveAs !== 'undefined') {
                        saveAs(new Blob([pdfDocBytes], { type: 'application/pdf' }), 'Daedalus_unlocked.pdf');
                    } else {
                        const blob = new Blob([pdfDocBytes], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = 'Daedalus_unlocked.pdf';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }
                } catch (err) {
                    alert('Failed to unlock PDF. Please check the password or ensure the file is not corrupted. Error: ' + err.message);
                } finally {
                    unlockBtn.disabled = false;
                    unlockBtn.innerHTML = '<i data-feather="unlock" class="inline-block mr-2"></i>Unlock PDF';
                    feather.replace();
                }
            });
        });