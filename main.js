        // Global state
        let articles = [];
        let tags = [];
        let tagSummaries = [];
        let tagFrequency = {};
        let activeTag = null;
        let currentTheme = localStorage.getItem('theme') || 'light';

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            applyTheme(currentTheme);
            loadData();
        });

        // Theme management
        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            const themeToggle = document.querySelector('.theme-toggle');
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            localStorage.setItem('theme', theme);
        }

        function toggleTheme() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(currentTheme);
        }

        // Data loading
        async function loadData() {
            try {
                const [tagsResponse, articlesResponse, tagSummariesResponse] = await Promise.all([
                    fetch('tags.json'),
                    fetch('news.json'),
                    fetch('tag_summaries.json')
                ]);

                if (!tagsResponse.ok || !articlesResponse.ok || !tagSummariesResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                tags = await tagsResponse.json();
                articles = await articlesResponse.json();
                tagSummaries = await tagSummariesResponse.json();

                calculateTagFrequency();
                renderTags();
                renderArticles();
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }

        // Calculate tag frequency
        function calculateTagFrequency() {
            tagFrequency = {};
            articles.forEach(article => {
                const articleTags = article.tags.split(',').map(t => parseInt(t.trim()));
                articleTags.forEach(tagId => {
                    tagFrequency[tagId] = (tagFrequency[tagId] || 0) + 1;
                });
            });
        }

        // Render tags
        function renderTags() {
            const container = document.getElementById('tagsContainer');
            container.innerHTML = '';

            // Sort tags by frequency
            const sortedTags = tags.sort((a, b) => (tagFrequency[b.id] || 0) - (tagFrequency[a.id] || 0));

            // Add "All" tag
            const allTag = document.createElement('div');
            allTag.className = 'tag frequent';
            allTag.textContent = 'All';
            allTag.onclick = () => filterByTag(null);
            if (!activeTag) allTag.classList.add('active');
            container.appendChild(allTag);

            // Add other tags with size classes
            sortedTags.forEach(tag => {
                const frequency = tagFrequency[tag.id] || 0;
                let sizeClass = 'none';
                if (frequency >= 3) sizeClass = 'frequent';
                else if (frequency >= 2) sizeClass = 'normal';
                else if (frequency >= 1) sizeClass = 'rare';

                const tagElement = document.createElement('div');
                tagElement.className = `tag ${sizeClass}`;
                tagElement.textContent = tag.tag;
                tagElement.onclick = () => filterByTag(tag.id);
                if (activeTag === tag.id) tagElement.classList.add('active');
                container.appendChild(tagElement);
            });
        }

        // Filter articles by tag
        function filterByTag(tagId) {
            if (activeTag === tagId) {
                activeTag = null;
            } else {
                activeTag = tagId;
            }
            renderTags();
            renderArticles();
        }

        // Render articles
        function renderArticles() {
            const grid = document.getElementById('articlesGrid');
            const loading = document.getElementById('loading');
            const noArticles = document.getElementById('noArticles');

            loading.style.display = 'none';

            let filteredArticles = articles;
            if (activeTag) {
                filteredArticles = articles.filter(article => 
                    article.tags.split(',').map(t => parseInt(t.trim())).includes(activeTag)
                );
            }

            if (filteredArticles.length === 0) {
                grid.style.display = 'none';
                noArticles.style.display = 'block';
                return;
            }

            grid.style.display = 'grid';
            noArticles.style.display = 'none';
            grid.innerHTML = '';

            filteredArticles.forEach(article => {
                const card = createArticleCard(article);
                grid.appendChild(card);
            });
        }

        // Create article card
        function createArticleCard(article) {
            const card = document.createElement('div');
            card.className = 'article-card';
            card.onclick = () => openModal(article);

            const articleTags = article.tags.split(',').map(t => parseInt(t.trim()));
            const tagNames = articleTags.map(tagId => {
                const tag = tags.find(t => t.id === tagId);
                return tag ? tag.tag : '';
            }).filter(Boolean);

            const timeAgo = getTimeAgo(new Date(article.ctime));

            card.innerHTML = `
                <h2 class="article-header">${article.title}</h2>
                <div class="article-meta">
                    <span>${timeAgo}</span>
                    <span>${getReadingTime(article.long)} min read</span>
                </div>
                <limitingElement>
                    <p class="article-excerpt">${article.long}</p>
                </limitingElement>
                <div class="article-tags">
                    ${tagNames.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
                </div>
            `;

            return card;
        }

        // Open modal
        function openModal(article) {
            const modal = document.getElementById('articleModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalText = document.getElementById('modalText');
            const modalMeta = document.getElementById('modalMeta');
            const modalTags = document.getElementById('modalTags');
            const modalLink = document.getElementById('modalLink');

            modalTitle.textContent = article.title;
            modalText.innerHTML = article.long.split('\n').map(p => `<p>${p}</p>`).join('');
            
            const articleTags = article.tags.split(',').map(t => parseInt(t.trim()));
            const tagNames = articleTags.map(tagId => {
                const tag = tags.find(t => t.id === tagId);
                return tag ? tag.tag : '';
            }).filter(Boolean);

            modalMeta.innerHTML = `
                <span>${new Date(article.ctime).toLocaleDateString()}</span>
                <span>${getReadingTime(article.long)} min read</span>
            `;

            modalTags.innerHTML = tagNames.map(tag => `<span class="article-tag">${tag}</span>`).join('');
            modalLink.href = article.orjLink;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Close modal
        function closeModal() {
            const modal = document.getElementById('articleModal');
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Close modal on background click
        document.getElementById('articleModal').addEventListener('click', (e) => {
            if (e.target.id === 'articleModal') {
                closeModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        // Utility functions
        function getTimeAgo(date) {
            const seconds = Math.floor((new Date() - date) / 1000);
            const intervals = {
                year: 31536000,
                month: 2592000,
                week: 604800,
                day: 86400,
                hour: 3600,
                minute: 60
            };

            for (const [unit, secondsInUnit] of Object.entries(intervals)) {
                const interval = Math.floor(seconds / secondsInUnit);
                if (interval >= 1) {
                    return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
                }
            }
            return 'Just now';
        }

        function getReadingTime(text) {
            const wordsPerMinute = 200;
            const words = text.split(/\s+/).length;
            return Math.ceil(words / wordsPerMinute);
        }