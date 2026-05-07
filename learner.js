const OPENLEARN_STATE_KEY = 'openlearn-learner-state';

(function() {
	const navScript = document.querySelector('script[src$="nav.js"]');
	const siteRootUrl = navScript
		? new URL(navScript.getAttribute('src'), window.location.href)
		: new URL('nav.js', window.location.href);
	const baseUrl = new URL('.', siteRootUrl);

	let catalogPromise = null;

	function getAuthApi() {
		return window.OpenLearnAuth || null;
	}

	function waitForAuthReady() {
		return window.__openLearnAuthReady || Promise.resolve(null);
	}

	function injectLearnerStyles() {
		if (document.getElementById('openlearn-learner-styles')) {
			return;
		}

		const style = document.createElement('style');
		style.id = 'openlearn-learner-styles';
		style.textContent = `
			.learner-dashboard {
				margin: 18px auto 42px;
				padding: 28px;
				border-radius: 30px;
				background:
					linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(239, 246, 255, 0.84)),
					radial-gradient(circle at top right, rgba(56, 189, 248, 0.16), transparent 36%);
				border: 1px solid rgba(191, 219, 254, 0.9);
				box-shadow: 0 24px 54px rgba(15, 23, 42, 0.10);
			}

			.learner-dashboard h2,
			.learner-section h3,
			.ol-page-actions h3,
			.ol-related-section h2 {
				margin: 0;
				color: #0f172a;
				letter-spacing: -0.02em;
			}

			.learner-dashboard p,
			.learner-empty,
			.learner-card p,
			.learner-meta,
			.ol-related-card p,
			.ol-related-meta,
			.ol-progress-note {
				color: #64748b;
			}

			.learner-header {
				display: flex;
				align-items: end;
				justify-content: space-between;
				gap: 16px;
				margin-bottom: 22px;
			}

			.learner-kicker {
				display: inline-flex;
				padding: 7px 12px;
				border-radius: 999px;
				background: rgba(219, 234, 254, 0.68);
				color: #1d4ed8;
				font-size: 12px;
				font-weight: 800;
				text-transform: uppercase;
				letter-spacing: 0.08em;
				margin-bottom: 10px;
			}

			.learner-stats {
				display: grid;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				gap: 16px;
				margin-bottom: 24px;
			}

			.learner-stat {
				padding: 18px 20px;
				border-radius: 22px;
				background: rgba(255, 255, 255, 0.78);
				border: 1px solid rgba(219, 234, 254, 0.92);
				box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
			}

			.learner-stat strong {
				display: block;
				font-size: 28px;
				line-height: 1;
				margin-bottom: 8px;
				color: #0f172a;
			}

			.learner-grid {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 20px;
			}

			.learner-section {
				padding: 22px;
				border-radius: 24px;
				background: rgba(255, 255, 255, 0.78);
				border: 1px solid rgba(219, 234, 254, 0.9);
				box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
			}

			.learner-list {
				display: grid;
				gap: 12px;
				margin-top: 16px;
			}

			.learner-card,
			.ol-related-card {
				display: block;
				padding: 18px 20px;
				border-radius: 18px;
				background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
				border: 1px solid rgba(219, 234, 254, 0.92);
				box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
				transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
			}

			.learner-card:hover,
			.ol-related-card:hover {
				transform: translateY(-3px);
				box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);
				border-color: rgba(96, 165, 250, 0.55);
			}

			.learner-card strong,
			.ol-related-card strong {
				display: block;
				margin-bottom: 6px;
				color: #0f172a;
			}

			.learner-card p,
			.ol-related-card p {
				margin: 0 0 10px;
				line-height: 1.65;
			}

			.learner-meta,
			.ol-related-meta {
				font-size: 13px;
				font-weight: 600;
			}

			.ol-card-save,
			.ol-primary-action,
			.ol-secondary-action {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				border: 1px solid rgba(148, 163, 184, 0.24);
				border-radius: 999px;
				font: inherit;
				font-size: 13px;
				font-weight: 700;
				cursor: pointer;
				transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease, color 0.22s ease, border-color 0.22s ease;
			}

			.ol-card-save {
				padding: 10px 14px;
				background: rgba(255, 255, 255, 0.88);
				color: #0f172a;
				box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
			}

			.ol-card-save:hover,
			.ol-primary-action:hover,
			.ol-secondary-action:hover {
				transform: translateY(-2px);
			}

			.ol-card-save.is-active,
			.ol-secondary-action.is-active {
				background: linear-gradient(135deg, #dcfce7, #d1fae5);
				color: #166534;
				border-color: rgba(22, 101, 52, 0.16);
			}

			.ol-save-stack {
				display: flex;
				gap: 10px;
				flex-wrap: wrap;
			}

			.course-card,
			.resource-card,
			.card-preview,
			.project-card,
			.career-card {
				position: relative;
			}

			.resource-card,
			.course-card {
				align-items: stretch;
			}

			.resource-main,
			.course-card .info {
				display: flex;
				flex-direction: column;
				gap: 10px;
				flex: 1;
				min-width: 0;
			}

			.resource-main {
				max-width: none;
			}

			.resource-main h3,
			.course-card .info h3 {
				margin: 0;
				line-height: 1.35;
			}

			.resource-main .muted,
			.course-card .info p {
				margin: 0;
				line-height: 1.7;
			}

			.resource-card .meta,
			.course-card .meta,
			.learner-meta,
			.ol-related-meta {
				margin-top: auto;
				padding-top: 10px;
				border-top: 1px solid rgba(226, 232, 240, 0.86);
				line-height: 1.5;
			}

			.tag-row-small,
			.course-tags,
			.project-tech,
			.preview-meta,
			.path-meta,
			.career-details {
				display: flex;
				flex-wrap: wrap;
				gap: 10px;
				align-items: center;
			}

			.tag-chip.small,
			.course-tags span,
			.project-tech span {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				padding: 6px 10px;
				border-radius: 999px;
				line-height: 1.2;
			}

			.resource-action {
				display: flex;
				align-items: center;
				justify-content: flex-end;
				gap: 10px;
				flex-wrap: wrap;
				align-self: stretch;
			}

			.ol-floating-save {
				position: absolute;
				top: 16px;
				right: 16px;
				z-index: 2;
			}

			.ol-page-actions {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 18px;
				flex-wrap: wrap;
				margin: 18px 0 30px;
				padding: 18px 20px;
				border-radius: 22px;
				background: rgba(248, 250, 252, 0.84);
				border: 1px solid rgba(219, 234, 254, 0.9);
				box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
			}

			.ol-page-actions p {
				margin: 6px 0 0;
			}

			.ol-page-actions-buttons {
				display: flex;
				gap: 10px;
				flex-wrap: wrap;
			}

			.ol-primary-action {
				padding: 11px 18px;
				background: linear-gradient(135deg, #2563eb, #0ea5e9);
				color: #ffffff;
				border-color: transparent;
				box-shadow: 0 14px 26px rgba(37, 99, 235, 0.20);
			}

			.ol-secondary-action {
				padding: 11px 18px;
				background: rgba(255, 255, 255, 0.9);
				color: #0f172a;
				box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
			}

			.ol-related-section {
				margin: 12px auto 48px;
			}

			.ol-related-grid {
				display: grid;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				gap: 18px;
				margin-top: 18px;
			}

			.ol-related-card {
				min-height: 100%;
			}

			html[data-theme="dark"] .learner-dashboard,
			html[data-theme="dark"] .learner-section,
			html[data-theme="dark"] .learner-stat,
			html[data-theme="dark"] .ol-page-actions,
			html[data-theme="dark"] .learner-card,
			html[data-theme="dark"] .ol-related-card,
			html[data-theme="dark"] .ol-card-save,
			html[data-theme="dark"] .ol-secondary-action {
				background: linear-gradient(180deg, rgba(28, 32, 42, 0.94), rgba(22, 26, 35, 0.94));
				border-color: rgba(148, 163, 184, 0.14);
				box-shadow: 0 18px 34px rgba(2, 6, 23, 0.26);
				color: #dbe4f0;
			}

			html[data-theme="dark"] .learner-dashboard h2,
			html[data-theme="dark"] .learner-section h3,
			html[data-theme="dark"] .learner-card strong,
			html[data-theme="dark"] .ol-related-section h2,
			html[data-theme="dark"] .ol-related-card strong,
			html[data-theme="dark"] .ol-page-actions h3,
			html[data-theme="dark"] .learner-stat strong {
				color: #f8fafc;
			}

			html[data-theme="dark"] .learner-dashboard p,
			html[data-theme="dark"] .learner-empty,
			html[data-theme="dark"] .learner-card p,
			html[data-theme="dark"] .learner-meta,
			html[data-theme="dark"] .ol-related-card p,
			html[data-theme="dark"] .ol-related-meta,
			html[data-theme="dark"] .ol-progress-note {
				color: #98a2b3;
			}

			html[data-theme="dark"] .learner-kicker {
				background: rgba(45, 212, 191, 0.14);
				color: #99f6e4;
			}

			html[data-theme="dark"] .resource-card .meta,
			html[data-theme="dark"] .course-card .meta,
			html[data-theme="dark"] .learner-meta,
			html[data-theme="dark"] .ol-related-meta {
				border-top-color: rgba(148, 163, 184, 0.14);
			}

			html[data-theme="dark"] .ol-card-save.is-active,
			html[data-theme="dark"] .ol-secondary-action.is-active {
				background: linear-gradient(135deg, rgba(20, 184, 166, 0.24), rgba(14, 165, 233, 0.18));
				color: #ccfbf1;
				border-color: rgba(45, 212, 191, 0.16);
			}

			html[data-theme="dark"] .ol-primary-action {
				background: linear-gradient(135deg, #14b8a6, #0ea5e9);
				box-shadow: 0 14px 28px rgba(20, 184, 166, 0.20);
			}

			@media (max-width: 900px) {
				.learner-stats,
				.learner-grid,
				.ol-related-grid {
					grid-template-columns: 1fr;
				}
			}

			@media (max-width: 768px) {
				.learner-dashboard {
					padding: 22px;
					border-radius: 24px;
				}

				.learner-header,
				.ol-page-actions {
					flex-direction: column;
					align-items: flex-start;
				}

				.ol-page-actions-buttons,
				.ol-save-stack {
					width: 100%;
				}

				.ol-primary-action,
				.ol-secondary-action,
				.ol-card-save {
					width: 100%;
				}

				.resource-action {
					width: 100%;
					justify-content: stretch;
				}
			}
		`;

		document.head.appendChild(style);
	}

	function safeReadState() {
		const authApi = getAuthApi();
		if (authApi) {
			return authApi.getLearnerState();
		}

		try {
			const raw = localStorage.getItem(OPENLEARN_STATE_KEY);
			const parsed = raw ? JSON.parse(raw) : {};
			return {
				saved: Array.isArray(parsed.saved) ? parsed.saved : [],
				progress: parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {},
				recent: Array.isArray(parsed.recent) ? parsed.recent : []
			};
		} catch (error) {
			return { saved: [], progress: {}, recent: [] };
		}
	}

	function writeState(state) {
		localStorage.setItem(OPENLEARN_STATE_KEY, JSON.stringify(state));
		const authApi = getAuthApi();
		if (authApi && authApi.isAuthenticated()) {
			authApi.setLearnerState(state).catch(() => {
				// Keep local UI responsive even if the network save fails.
			});
		}
	}

	function canonicalPathFromHref(href) {
		try {
			return new URL(href, baseUrl).pathname.toLowerCase();
		} catch (error) {
			return '';
		}
	}

	function createId(item) {
		return `${item.kind}:${item.link}`;
	}

	function fetchJson(filename) {
		return fetch(new URL(filename, baseUrl)).then((response) => {
			if (!response.ok) {
				throw new Error(`Failed to fetch ${filename}`);
			}
			return response.json();
		});
	}

	function loadCatalog() {
		if (!catalogPromise) {
			catalogPromise = Promise.all([
				fetchJson('data.json'),
				fetchJson('paths-data.json'),
				fetchJson('careers-data.json')
			]).then(([courses, paths, careers]) => {
				const allItems = [
					...courses.map((item) => ({ ...item, kind: 'course' })),
					...paths.map((item) => ({ ...item, kind: 'path' })),
					...careers.map((item) => ({ ...item, kind: 'career' }))
				].map((item) => ({
					...item,
					id: createId(item),
					canonicalPath: canonicalPathFromHref(item.link),
					tags: Array.isArray(item.tags) ? item.tags : []
				}));

				return { allItems };
			}).catch(() => ({ allItems: [] }));
		}

		return catalogPromise;
	}

	function findCurrentItem(allItems) {
		const currentPath = window.location.pathname.toLowerCase();
		return allItems.find((item) => item.canonicalPath === currentPath) || null;
	}

	function updateRecent(state, item) {
		const entry = {
			id: item.id,
			title: item.title,
			kind: item.kind,
			link: item.link,
			viewedAt: new Date().toISOString()
		};

		state.recent = [entry, ...state.recent.filter((recentItem) => recentItem.id !== item.id)].slice(0, 8);
	}

	function trackProgress(item) {
		const state = safeReadState();
		const current = state.progress[item.id] || {};
		state.progress[item.id] = {
			id: item.id,
			title: item.title,
			kind: item.kind,
			link: item.link,
			visits: (current.visits || 0) + 1,
			completed: Boolean(current.completed),
			updatedAt: new Date().toISOString()
		};
		updateRecent(state, item);
		writeState(state);
		return state;
	}

	function toggleSaved(item) {
		const state = safeReadState();
		const exists = state.saved.some((savedItem) => savedItem.id === item.id);
		if (exists) {
			state.saved = state.saved.filter((savedItem) => savedItem.id !== item.id);
		} else {
			state.saved.unshift({
				id: item.id,
				title: item.title,
				kind: item.kind,
				link: item.link,
				savedAt: new Date().toISOString()
			});
			state.saved = state.saved.slice(0, 24);
		}
		writeState(state);
		return !exists;
	}

	function toggleCompleted(item) {
		const state = safeReadState();
		const current = state.progress[item.id] || {
			id: item.id,
			title: item.title,
			kind: item.kind,
			link: item.link,
			visits: 1
		};
		const completed = !current.completed;
		state.progress[item.id] = {
			...current,
			completed,
			updatedAt: new Date().toISOString()
		};
		updateRecent(state, item);
		writeState(state);
		return completed;
	}

	function getKindLabel(kind) {
		if (kind === 'path') return 'Path';
		if (kind === 'career') return 'Career';
		return 'Course';
	}

	function buildMetaLine(item) {
		const parts = [getKindLabel(item.kind)];
		if (item.level) parts.push(item.level);
		if (item.lessons) parts.push(`${item.lessons} lessons`);
		return parts.join(' • ');
	}

	function renderCardList(items, emptyCopy) {
		if (!items.length) {
			return `<p class="learner-empty">${emptyCopy}</p>`;
		}

		return `<div class="learner-list">${items.map((item) => `
			<a class="learner-card" href="${item.link}">
				<strong>${item.title}</strong>
				<p>${item.description || 'Keep building momentum with this next step.'}</p>
				<div class="learner-meta">${buildMetaLine(item)}</div>
			</a>
		`).join('')}</div>`;
	}

	function renderDashboard(allItems) {
		if (!document.body.classList.contains('home-page')) {
			return;
		}

		const main = document.querySelector('main');
		const aboutSection = document.querySelector('.about');
		if (!main || document.getElementById('learnerDashboard')) {
			return;
		}

		const state = safeReadState();
		const savedItems = state.saved.map((entry) => allItems.find((item) => item.id === entry.id)).filter(Boolean).slice(0, 3);
		const continueItems = Object.values(state.progress)
			.filter((entry) => !entry.completed)
			.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
			.map((entry) => allItems.find((item) => item.id === entry.id))
			.filter(Boolean)
			.slice(0, 3);
		const recentItems = state.recent
			.map((entry) => allItems.find((item) => item.id === entry.id))
			.filter(Boolean)
			.slice(0, 3);

		const completedCount = Object.values(state.progress).filter((entry) => entry.completed).length;
		const dashboard = document.createElement('section');
		dashboard.id = 'learnerDashboard';
		dashboard.className = 'learner-dashboard container';
		dashboard.innerHTML = `
			<div class="learner-header">
				<div>
					<span class="learner-kicker">Learner hub</span>
					<h2>Keep your learning moving</h2>
					<p>Saved picks, recent pages, and your next best step all in one place.</p>
				</div>
			</div>
			<div class="learner-stats">
				<div class="learner-stat">
					<strong>${state.saved.length}</strong>
					<span>Saved items</span>
				</div>
				<div class="learner-stat">
					<strong>${completedCount}</strong>
					<span>Completed milestones</span>
				</div>
				<div class="learner-stat">
					<strong>${state.recent.length}</strong>
					<span>Recently viewed</span>
				</div>
			</div>
			<div class="learner-grid">
				<div class="learner-section">
					<h3>Continue learning</h3>
					${renderCardList(continueItems.length ? continueItems : recentItems, 'Open a course or path and your recent progress will show up here.')}
				</div>
				<div class="learner-section">
					<h3>Saved picks</h3>
					${renderCardList(savedItems, 'Save courses, careers, or learning paths to build your own shortlist.')}
				</div>
			</div>
		`;

		if (aboutSection) {
			main.insertBefore(dashboard, aboutSection);
		} else {
			main.appendChild(dashboard);
		}
	}

	function attachSaveButton(target, item, options = {}) {
		if (!target || target.querySelector(`.ol-card-save[data-item-id="${item.id}"]`)) {
			return;
		}

		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'ol-card-save';
		button.dataset.itemId = item.id;
		if (options.floating) {
			button.classList.add('ol-floating-save');
		}

		const sync = () => {
			const saved = safeReadState().saved.some((savedItem) => savedItem.id === item.id);
			button.classList.toggle('is-active', saved);
			button.textContent = saved ? 'Saved' : 'Save';
			button.setAttribute('aria-pressed', String(saved));
			button.title = saved ? 'Remove from saved items' : 'Save this item';
		};

		sync();

		button.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			toggleSaved(item);
			sync();
			renderDashboard(window.__openLearnItems || []);
		});

		target.appendChild(button);
	}

	function decorateListingCards(allItems) {
		const cards = document.querySelectorAll('.resource-card, .course-card, .card-preview');
		cards.forEach((card) => {
			if (card.dataset.olEnhanced === 'true') {
				return;
			}

			const anchor = card.matches('a[href]') ? card : card.closest('a[href]') || card.querySelector('a[href]');
			if (!anchor) {
				return;
			}

			const canonical = canonicalPathFromHref(anchor.getAttribute('href'));
			const item = allItems.find((entry) => entry.canonicalPath === canonical);
			if (!item) {
				return;
			}

			const existingAction = card.querySelector('.resource-action');
			if (existingAction) {
				const stack = document.createElement('div');
				stack.className = 'ol-save-stack';
				existingAction.appendChild(stack);
				attachSaveButton(stack, item);
			} else {
				attachSaveButton(card, item, { floating: true });
			}

			card.dataset.olEnhanced = 'true';
		});
	}

	function renderPageActions(item) {
		if (!item || document.getElementById('olPageActions')) {
			return;
		}

		const host = document.querySelector('.course-hero + .course-section .container, .path-detail-container, main > .container, main');
		if (!host) {
			return;
		}

		const currentState = safeReadState();
		const progress = currentState.progress[item.id] || { visits: 1, completed: false };
		const actions = document.createElement('section');
		actions.id = 'olPageActions';
		actions.className = 'ol-page-actions';
		actions.innerHTML = `
			<div>
				<h3>Your OpenLearn progress</h3>
				<p class="ol-progress-note">Visits: ${progress.visits || 1}${progress.completed ? ' • Marked complete' : ' • In progress'}</p>
			</div>
			<div class="ol-page-actions-buttons">
				<button type="button" class="ol-secondary-action" id="olSavePage"></button>
				<button type="button" class="ol-primary-action" id="olCompletePage"></button>
			</div>
		`;

		host.insertBefore(actions, host.firstChild);

		const saveButton = actions.querySelector('#olSavePage');
		const completeButton = actions.querySelector('#olCompletePage');

		const syncButtons = () => {
			const state = safeReadState();
			const isSaved = state.saved.some((savedItem) => savedItem.id === item.id);
			const progressEntry = state.progress[item.id] || { visits: 1, completed: false };

			saveButton.classList.toggle('is-active', isSaved);
			saveButton.textContent = isSaved ? 'Saved to your list' : 'Save this item';
			saveButton.setAttribute('aria-pressed', String(isSaved));

			completeButton.classList.toggle('is-active', Boolean(progressEntry.completed));
			completeButton.textContent = progressEntry.completed ? 'Completed' : 'Mark as complete';

			const note = actions.querySelector('.ol-progress-note');
			note.textContent = `Visits: ${progressEntry.visits || 1}${progressEntry.completed ? ' • Marked complete' : ' • In progress'}`;
		};

		syncButtons();

		saveButton.addEventListener('click', () => {
			toggleSaved(item);
			syncButtons();
			renderDashboard(window.__openLearnItems || []);
		});

		completeButton.addEventListener('click', () => {
			toggleCompleted(item);
			syncButtons();
			renderDashboard(window.__openLearnItems || []);
		});
	}

	function renderRelatedSection(currentItem, allItems) {
		if (!currentItem || document.getElementById('olRelatedSection')) {
			return;
		}

		const main = document.querySelector('main');
		const footer = document.querySelector('.site-footer');
		if (!main) {
			return;
		}

		const related = allItems
			.filter((item) => item.id !== currentItem.id)
			.map((item) => {
				const sharedTags = item.tags.filter((tag) => currentItem.tags.includes(tag)).length;
				const sameKind = item.kind === currentItem.kind ? 1 : 0;
				return { item, score: sharedTags * 2 + sameKind };
			})
			.filter((entry) => entry.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 3)
			.map((entry) => entry.item);

		if (!related.length) {
			return;
		}

		const section = document.createElement('section');
		section.id = 'olRelatedSection';
		section.className = 'ol-related-section container';
		section.innerHTML = `
			<div class="section-heading">
				<div>
					<span class="section-kicker">Recommended next</span>
					<h2>Keep going with related picks</h2>
				</div>
			</div>
			<div class="ol-related-grid">
				${related.map((item) => `
					<a class="ol-related-card" href="${item.link}">
						<strong>${item.title}</strong>
						<p>${item.description}</p>
						<div class="ol-related-meta">${buildMetaLine(item)}</div>
					</a>
				`).join('')}
			</div>
		`;

		if (footer && footer.parentNode === document.body) {
			document.body.insertBefore(section, footer);
		} else {
			main.appendChild(section);
		}
	}

	function observeListingUpdates(allItems) {
		const targets = [document.getElementById('resourcesList'), document.querySelector('.course-grid')].filter(Boolean);
		const observer = new MutationObserver(() => decorateListingCards(allItems));
		targets.forEach((target) => observer.observe(target, { childList: true, subtree: true }));
	}

	function isDetailPage() {
		const path = window.location.pathname.toLowerCase();
		return /\/courses\/.+\.html$/.test(path) || /\/paths\/[^/]+\.html$/.test(path) || /\/careers\/[^/]+\.html$/.test(path);
	}

	document.addEventListener('DOMContentLoaded', () => {
		injectLearnerStyles();

		waitForAuthReady().finally(() => {
			loadCatalog().then(({ allItems }) => {
			window.__openLearnItems = allItems;
			decorateListingCards(allItems);
			observeListingUpdates(allItems);
			renderDashboard(allItems);

			if (isDetailPage()) {
				const currentItem = findCurrentItem(allItems);
					if (currentItem) {
						trackProgress(currentItem);
						renderPageActions(currentItem);
						renderRelatedSection(currentItem, allItems);
						renderDashboard(allItems);
					}
				}
			});
		});
	});
})();
