document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const personaCards = document.querySelectorAll('.persona-card');
    const searchPanel = document.getElementById('searchPanel');
    const customQueryInput = document.getElementById('customQuery');
    const searchBtn = document.getElementById('searchBtn');
    const suggestionTags = document.querySelectorAll('.suggestion-tag');
    
    const loadingSection = document.getElementById('loadingSection');
    const pipelineSteps = document.querySelectorAll('.step');
    
    const resultsSection = document.getElementById('resultsSection');
    const personaDisplay = document.getElementById('personaDisplay');
    const explanationText = document.getElementById('explanationText');
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    
    const sortPills = document.querySelectorAll('.sort-pill');
    const candidatesTableBody = document.getElementById('candidatesTableBody');
    const dashboardContainer = document.getElementById('dashboardContainer');
    // State Variables
    let selectedPersonaId = null;
    let candidatesList = []; // Stores remaining candidates for client-side sorting
    let activeSortCriteria = []; // Array of active criteria: { field, ascending, element }
    // Persona Card Interaction
    personaCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selection from all cards
            personaCards.forEach(c => c.classList.remove('selected'));
            
            // Add selection to clicked card
            card.classList.add('selected');
            
            const personaId = parseInt(card.dataset.persona);
            selectedPersonaId = personaId;
            if (personaId === 6) {
                // Show Custom Search Panel
                searchPanel.style.display = 'block';
                // Scroll to search panel
                searchPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                // Hide search panel & trigger immediate recommendation
                searchPanel.style.display = 'none';
                customQueryInput.value = '';
                getRecommendations(personaId);
            }
        });
    });
    // Custom Search Button Click
    searchBtn.addEventListener('click', () => {
        const query = customQueryInput.value.trim();
        if (!query) {
            alert('Please enter a query or budget preference.');
            return;
        }
        getRecommendations(6, query);
    });
    // Handle enter key in search field
    customQueryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
    // Suggestion tags helper
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', () => {
            customQueryInput.value = tag.textContent;
            getRecommendations(6, tag.textContent);
        });
    });
    // Client-side Multi-Criteria Candidate Sorting
    sortPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const field = pill.dataset.field;
            const isAscending = pill.dataset.asc === 'true';
            
            const index = activeSortCriteria.findIndex(c => c.field === field);
            if (index === -1) {
                // Add sorting criteria to active state
                activeSortCriteria.push({ field, ascending: isAscending, element: pill });
                pill.classList.add('active');
            } else {
                // Remove sorting criteria from active state
                activeSortCriteria.splice(index, 1);
                pill.classList.remove('active');
            }
            
            // Render priority numbers
            updatePriorityBadges();
            
            // Run sorting
            sortAndRenderCandidatesMulti();
        });
    });
    function updatePriorityBadges() {
        // Clear all badges
        sortPills.forEach(pill => {
            const badge = pill.querySelector('.priority-badge');
            if (badge) badge.textContent = '';
        });
        
        // Render current order
        activeSortCriteria.forEach((criteria, order) => {
            const badge = criteria.element.querySelector('.priority-badge');
            if (badge) badge.textContent = (order + 1).toString();
        });
    }
    // Retrieve Recommendations from API
    async function getRecommendations(personaId, query = '') {
        // Reset and show loading state
        resultsSection.style.display = 'none';
        loadingSection.style.display = 'block';
        loadingSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Reset pipeline steps visual state
        pipelineSteps.forEach(step => {
            step.className = 'step';
        });
        
        // Run simulated pipeline visualization
        const runPipelineAnimation = async () => {
            for (let i = 0; i < pipelineSteps.length - 1; i++) {
                pipelineSteps[i].classList.add('active');
                await delay(400);
                pipelineSteps[i].classList.remove('active');
                pipelineSteps[i].classList.add('done');
            }
            pipelineSteps[pipelineSteps.length - 1].classList.add('active');
        };
        const animationPromise = runPipelineAnimation();
        
        try {
            const response = await fetch('/api/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    persona_id: personaId,
                    query: query
                })
            });
            const data = await response.json();
            
            // Wait for animation to catch up or complete
            await animationPromise;
            await delay(200);
            if (response.ok) {
                // Complete last step
                pipelineSteps[pipelineSteps.length - 1].classList.remove('active');
                pipelineSteps[pipelineSteps.length - 1].classList.add('done');
                await delay(200);
                // Populate and Display results
                renderResults(data);
            } else {
                alert(`Error: ${data.error || 'Failed to fetch recommendations.'}`);
                loadingSection.style.display = 'none';
            }
        } catch (err) {
            console.error(err);
            alert('An unexpected network error occurred.');
            loadingSection.style.display = 'none';
        }
    }
    // Render results pane
    function renderResults(data) {
        // Hide loading
        loadingSection.style.display = 'none';
        
        // Show Results Section
        resultsSection.style.display = 'flex';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        // Update Persona Display Header
        personaDisplay.textContent = `Persona: ${data.persona.name}`;
        // Format and render LLM explanation markdown to basic HTML
        explanationText.innerHTML = formatMarkdown(data.explanation);
        // Render Top 3 Recommendation Cards
        recommendationsGrid.innerHTML = '';
        data.recommendations.forEach((phone, idx) => {
            const cardHtml = createRecommendationCard(phone, idx + 1);
            recommendationsGrid.insertAdjacentHTML('beforeend', cardHtml);
        });
        // Store candidates for client-side sorting
        candidatesList = data.candidates || [];
        
        // Render candidates dashboard if candidates list exists
        if (candidatesList.length > 0) {
            dashboardContainer.style.display = 'block';
            
            // Set default sorting to recommendation_score
            activeSortCriteria = [];
            sortPills.forEach(pill => pill.classList.remove('active'));
            
            const defaultPill = document.querySelector('.sort-pill[data-field="recommendation_score"]');
            if (defaultPill) {
                activeSortCriteria.push({ field: 'recommendation_score', ascending: false, element: defaultPill });
                defaultPill.classList.add('active');
            }
            
            updatePriorityBadges();
            sortAndRenderCandidatesMulti();
        } else {
            dashboardContainer.style.display = 'none';
        }
    }
    // Create HTML for a Top 3 Card
    function createRecommendationCard(phone, rank) {
        const price = phone.launch_price > 0 
            ? `${formatCurrency(phone.launch_price)}` 
            : 'N/A';
        const year = phone.launch_year > 0 ? Math.round(phone.launch_year) : 'Older';
        // Prepare specs
        const ram = phone.ram_gb ? `${Math.round(phone.ram_gb)} GB` : 'N/A';
        const storage = phone.storage_gb ? `${Math.round(phone.storage_gb)} GB` : 'N/A';
        const battery = phone.battery_mah ? `${Math.round(phone.battery_mah)} mAh` : 'N/A';
        const screen = phone.screen_size_inch ? `${phone.screen_size_inch.toFixed(1)}"` : 'N/A';
        
        // Camera Info
        let cameraInfo = `${Math.round(phone.main_camera_mp)}MP Main`;
        if (phone.telephoto_mp > 0) cameraInfo += ` + ${Math.round(phone.telephoto_mp)}MP Tele`;
        if (phone.ultrawide_mp > 0) cameraInfo += ` + ${Math.round(phone.ultrawide_mp)}MP Wide`;
        // Progress bar classes helper
        const getScoreClass = (score) => {
            if (score >= 8.0) return 'score-high';
            if (score >= 5.0) return 'score-mid';
            return 'score-low';
        };
        return `
            <div class="recommendation-card">
                <div class="rank-badge">#${rank}</div>
                <div class="phone-header">
                    <h3 class="phone-name">${phone.name}</h3>
                    <div class="phone-meta">
                        <span class="tag-segment">${phone.target_segment || 'All-Rounder'}</span>
                        <span>Launch: ${year}</span>
                    </div>
                </div>
                
                <div class="launch-price-banner">
                    <span>Launch Price:</span>
                    <span class="price-val">${price}</span>
                </div>
                <div class="specs-summary">
                    <div class="spec-item">
                        <span class="spec-lbl">Memory</span>
                        <span class="spec-val">${ram} RAM</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-lbl">Storage</span>
                        <span class="spec-val">${storage}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-lbl">Battery</span>
                        <span class="spec-val">${battery}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-lbl">Display</span>
                        <span class="spec-val">${screen} ${Math.round(phone.refresh_rate_hz || 60)}Hz</span>
                    </div>
                    <div class="spec-item" style="grid-column: span 2">
                        <span class="spec-lbl">Camera Rig</span>
                        <span class="spec-val" style="font-size: 0.85rem;">${cameraInfo}</span>
                    </div>
                </div>
                <div class="scores-section">
                    <span class="scores-section-title">Hardware Subsystem Evaluation</span>
                    
                    <div class="score-bar-group ${getScoreClass(phone.performance_score)}">
                        <div class="score-bar-lbl">
                            <span>Performance</span>
                            <span>${phone.performance_score.toFixed(1)}/10</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-bar" style="width: ${phone.performance_score * 10}%"></div>
                        </div>
                    </div>
                    <div class="score-bar-group ${getScoreClass(phone.camera_score)}">
                        <div class="score-bar-lbl">
                            <span>Camera Capabilities</span>
                            <span>${phone.camera_score.toFixed(1)}/10</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-bar" style="width: ${phone.camera_score * 10}%"></div>
                        </div>
                    </div>
                    <div class="score-bar-group ${getScoreClass(phone.battery_score)}">
                        <div class="score-bar-lbl">
                            <span>Battery Efficiency</span>
                            <span>${phone.battery_score.toFixed(1)}/10</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-bar" style="width: ${phone.battery_score * 10}%"></div>
                        </div>
                    </div>
                    <div class="score-bar-group ${getScoreClass(phone.display_score)}">
                        <div class="score-bar-lbl">
                            <span>Display Quality</span>
                            <span>${phone.display_score.toFixed(1)}/10</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-bar" style="width: ${phone.display_score * 10}%"></div>
                        </div>
                    </div>
                    <div class="score-bar-group ${getScoreClass(phone.ai_score)}">
                        <div class="score-bar-lbl">
                            <span>Galaxy AI Integration</span>
                            <span>${phone.ai_score.toFixed(1)}/10</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-bar" style="width: ${phone.ai_score * 10}%"></div>
                        </div>
                    </div>
                    <div class="score-bar-group ${getScoreClass(phone.durability_score)}">
                        <div class="score-bar-lbl">
                            <span>Durability & Build</span>
                            <span>${phone.durability_score.toFixed(1)}/10</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-bar" style="width: ${phone.durability_score * 10}%"></div>
                        </div>
                    </div>
                    <div class="score-bar-group" style="margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                        <div class="score-bar-lbl" style="font-weight: 700; color: #fff;">
                            <span>Overall Recommendation</span>
                            <span>${phone.recommendation_score.toFixed(2)}/10</span>
                        </div>
                        <div class="progress-track" style="height: 8px;">
                            <div class="progress-bar" style="width: ${phone.recommendation_score * 10}%; background: var(--accent-gradient);"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    // Sort and render the candidates list using multiple selected criteria
    function sortAndRenderCandidatesMulti() {
        let sorted = [...candidatesList];
        
        if (activeSortCriteria.length > 0) {
            sorted.sort((a, b) => {
                for (let criteria of activeSortCriteria) {
                    const { field, ascending } = criteria;
                    let valA = a[field];
                    let valB = b[field];
                    // Handle null / undefined or invalid prices
                    if (valA === null || valA === undefined || (field === 'launch_price' && valA <= 0)) {
                        if (valB === null || valB === undefined || (field === 'launch_price' && valB <= 0)) continue;
                        return 1; // Put nulls at the end
                    }
                    if (valB === null || valB === undefined || (field === 'launch_price' && valB <= 0)) {
                        return -1;
                    }
                    if (valA !== valB) {
                        if (ascending) {
                            return valA > valB ? 1 : -1;
                        } else {
                            return valA < valB ? 1 : -1;
                        }
                    }
                }
                return 0;
            });
        }
        renderCandidatesTable(sorted.slice(0, 15)); // Display up to top 15 candidate entries
    }
    // Render candidates table body
    function renderCandidatesTable(items) {
        candidatesTableBody.innerHTML = '';
        
        if (items.length === 0) {
            candidatesTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No candidates match the criteria.</td></tr>`;
            return;
        }
        items.forEach((phone, idx) => {
            const price = phone.launch_price > 0 ? formatCurrency(phone.launch_price) : 'N/A';
            const year = phone.launch_year > 0 ? Math.round(phone.launch_year) : 'Older';
            const ram = phone.ram_gb ? `${Math.round(phone.ram_gb)}G` : 'N/A';
            const storage = phone.storage_gb ? `${Math.round(phone.storage_gb)}G` : 'N/A';
            const battery = phone.battery_mah ? `${Math.round(phone.battery_mah)}mAh` : 'N/A';
            const rowHtml = `
                <tr>
                    <td>${idx + 1}</td>
                    <td>
                        <span class="cand-name">${phone.name}</span><br>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${phone.series || ''}</span>
                    </td>
                    <td>${year}</td>
                    <td>${price}</td>
                    <td><span class="cand-score">${phone.recommendation_score.toFixed(2)}</span></td>
                    <td>
                        <span class="cand-specs">${ram} RAM / ${storage} / ${battery}</span>
                    </td>
                    <td>
                        <div class="score-pills">
                            <span class="score-pill">Perf: <span>${phone.performance_score.toFixed(1)}</span></span>
                            <span class="score-pill">Cam: <span>${phone.camera_score.toFixed(1)}</span></span>
                            <span class="score-pill">Batt: <span>${phone.battery_score.toFixed(1)}</span></span>
                        </div>
                    </td>
                </tr>
            `;
            candidatesTableBody.insertAdjacentHTML('beforeend', rowHtml);
        });
    }
    // Simple delay helper for animation steps
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Helper to format currency values in Indian Rupees (INR)
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }
    // Simple markdown-to-HTML parser to display LLM responses cleanly
    function formatMarkdown(text) {
        if (!text) return '';
        
        let html = text;
        
        // Headers (e.g. ### Header)
        html = html.replace(/###\s*(.*?)(?:\n|$)/g, '<h3>$1</h3>');
        html = html.replace(/##\s*(.*?)(?:\n|$)/g, '<h2>$1</h2>');
        
        // Bold syntax (e.g. **bold**)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Multi-line bullet lists
        // Matches blocks of list items and wraps in <ul>
        html = html.replace(/(?:^\s*[-*]\s+(.*?)(?:\n|$))+/gm, (match) => {
            const items = match.split(/^\s*[-*]\s+/m).filter(Boolean);
            return '<ul>' + items.map(item => `<li>${item.trim()}</li>`).join('') + '</ul>';
        });
        // Convert double linebreaks to paragraphs
        html = html.split('\n\n').map(p => {
            p = p.trim();
            // Don't wrap headings and lists in <p> if they are already wrapped
            if (p.startsWith('<h') || p.startsWith('<ul')) return p;
            return `<p>${p}</p>`;
        }).join('');
        // Linebreaks replacement
        html = html.replace(/\n/g, '<br>');
        return html;
    }
});
