const THEME_STORAGE_KEY = 'openlearn-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

function loadLearnerScript() {
	const existingScript = document.getElementById('openlearn-learner-script');
	if (existingScript) {
		return;
	}

	const navScript = document.querySelector('script[src$="nav.js"]');
	if (!navScript) {
		return;
	}

	const learnerScript = document.createElement('script');
	learnerScript.id = 'openlearn-learner-script';
	learnerScript.src = navScript.getAttribute('src').replace(/nav\.js(\?.*)?$/i, 'learner.js');
	document.head.appendChild(learnerScript);
}

function loadAuthScript() {
	const existingScript = document.getElementById('openlearn-auth-script');
	if (existingScript) {
		return;
	}

	const navScript = document.querySelector('script[src$="nav.js"]');
	if (!navScript) {
		return;
	}

	const authScript = document.createElement('script');
	authScript.id = 'openlearn-auth-script';
	authScript.src = navScript.getAttribute('src').replace(/nav\.js(\?.*)?$/i, 'auth.js');
	document.head.appendChild(authScript);
}

function injectThemeStyles() {
	if (document.getElementById('openlearn-theme-styles')) {
		return;
	}

	const style = document.createElement('style');
	style.id = 'openlearn-theme-styles';
	style.textContent = `
		.header-inner {
			position: relative;
			justify-content: flex-start;
		}

		.theme-toggle {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			margin-left: 12px;
			width: 44px;
			height: 44px;
			padding: 0;
			border-radius: 999px;
			border: 1.5px solid rgba(15, 23, 42, 0.12);
			background: rgba(255, 255, 255, 0.92);
			color: #0f172a;
			cursor: pointer;
			flex-shrink: 0;
			box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
			transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
		}

		.theme-toggle:hover {
			transform: translateY(-1px);
			background: rgba(255, 255, 255, 0.96);
			border-color: rgba(15, 23, 42, 0.22);
			box-shadow: 0 14px 26px rgba(15, 23, 42, 0.12);
		}

		.theme-toggle:focus-visible {
			outline: 3px solid rgba(56, 189, 248, 0.35);
			outline-offset: 3px;
		}

		.theme-toggle-icon {
			position: relative;
			width: 24px;
			height: 24px;
		}

		.theme-toggle-sun-center {
			position: absolute;
			inset: 5px;
			border-radius: 50%;
			border: 2.5px solid currentColor;
			background: transparent;
			transition: opacity 0.25s ease, transform 0.25s ease;
		}

		.theme-toggle-sun-rays {
			position: absolute;
			inset: 0;
			transition: opacity 0.25s ease, transform 0.25s ease;
		}

		.theme-toggle-sun-rays::before {
			content: "";
			position: absolute;
			inset: 0;
			border-radius: 50%;
			background:
				linear-gradient(currentColor, currentColor) center 0 / 3px 6px no-repeat,
				linear-gradient(currentColor, currentColor) center 100% / 3px 6px no-repeat,
				linear-gradient(currentColor, currentColor) 0 center / 6px 3px no-repeat,
				linear-gradient(currentColor, currentColor) 100% center / 6px 3px no-repeat,
				linear-gradient(currentColor, currentColor) 3px 3px / 3px 6px no-repeat,
				linear-gradient(currentColor, currentColor) calc(100% - 3px) 3px / 3px 6px no-repeat,
				linear-gradient(currentColor, currentColor) 3px calc(100% - 3px) / 3px 6px no-repeat,
				linear-gradient(currentColor, currentColor) calc(100% - 3px) calc(100% - 3px) / 3px 6px no-repeat;
			transform: rotate(45deg);
		}

		.theme-toggle-moon {
			position: absolute;
			inset: 0;
			border-radius: 50%;
			background: currentColor;
			opacity: 0;
			transform: scale(0.72);
			transition: opacity 0.25s ease, transform 0.25s ease;
		}

		.theme-toggle-moon::after {
			content: "";
			position: absolute;
			top: 2px;
			left: 9px;
			width: 18px;
			height: 18px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.88);
		}

		.logo {
			order: 1;
		}

		.main-nav {
			order: 2;
			margin-left: auto;
		}

		.header-profile-menu {
			order: 3;
		}

		.theme-toggle {
			order: 4;
		}

		.nav-toggle {
			order: 5;
		}

		html[data-theme="dark"] body {
			background:
				radial-gradient(circle at top left, rgba(20, 184, 166, 0.10), transparent 22%),
				radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 24%),
				linear-gradient(180deg, #0f1117 0%, #151922 52%, #1a202b 100%);
			color: #d8dee9;
		}

		html[data-theme="dark"] .site-header {
			background: rgba(15, 17, 23, 0.82);
			border-bottom-color: rgba(148, 163, 184, 0.14);
			box-shadow: 0 18px 40px rgba(2, 6, 23, 0.46);
		}

		html[data-theme="dark"] .resources-hero,
		html[data-theme="dark"] .path-header {
			background:
				linear-gradient(145deg, rgba(24, 28, 37, 0.96), rgba(18, 23, 31, 0.96)),
				radial-gradient(circle at top right, rgba(45, 212, 191, 0.10), transparent 36%);
			border-color: rgba(148, 163, 184, 0.12);
			box-shadow: 0 28px 70px rgba(2, 6, 23, 0.42);
		}

		html[data-theme="dark"] .resources-hero::before,
		html[data-theme="dark"] .path-header::after {
			background: radial-gradient(circle, rgba(45, 212, 191, 0.14), transparent 68%);
		}

		html[data-theme="dark"] .resources-hero::after {
			background: radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 70%);
		}

		html[data-theme="dark"] .logo,
		html[data-theme="dark"] .hero-copy h1,
		html[data-theme="dark"] .hero-stats strong,
		html[data-theme="dark"] .hero-metrics strong,
		html[data-theme="dark"] .courses h2,
		html[data-theme="dark"] .course-card h3,
		html[data-theme="dark"] .about h2,
		html[data-theme="dark"] .feature strong,
		html[data-theme="dark"] .resources-hero h1,
		html[data-theme="dark"] .resource-card h3,
		html[data-theme="dark"] .resource-card h3 a,
		html[data-theme="dark"] .info-card h2,
		html[data-theme="dark"] .panel-card h2,
		html[data-theme="dark"] .feature-panel h3,
		html[data-theme="dark"] .profile-stat-card strong,
		html[data-theme="dark"] .profile-list-item strong,
		html[data-theme="dark"] .profile-highlight-card strong,
		html[data-theme="dark"] .profile-social-stat strong,
		html[data-theme="dark"] .contact-item strong,
		html[data-theme="dark"] .benefit-item strong,
		html[data-theme="dark"] .section-title,
		html[data-theme="dark"] .note-card h3,
		html[data-theme="dark"] .roadmap-content h3,
		html[data-theme="dark"] .playlist-card h3,
		html[data-theme="dark"] .path-detail-container h1,
		html[data-theme="dark"] .path-detail-container h2,
		html[data-theme="dark"] .path-detail-container h3,
		html[data-theme="dark"] .path-detail-container h4 {
			color: #f8fafc;
		}

		html[data-theme="dark"] .lead,
		html[data-theme="dark"] .meta,
		html[data-theme="dark"] .hero-metrics span,
		html[data-theme="dark"] .resource-card .muted,
		html[data-theme="dark"] .info-card p,
		html[data-theme="dark"] .panel-card p,
		html[data-theme="dark"] .feature-panel p,
		html[data-theme="dark"] .profile-list-item span,
		html[data-theme="dark"] .profile-empty,
		html[data-theme="dark"] .auth-intro,
		html[data-theme="dark"] .profile-bio,
		html[data-theme="dark"] .profile-social-stat span,
		html[data-theme="dark"] .contact-item p,
		html[data-theme="dark"] .benefit-item p,
		html[data-theme="dark"] .feature-list .feature p,
		html[data-theme="dark"] .playlist-card p,
		html[data-theme="dark"] .note-card p,
		html[data-theme="dark"] .roadmap-content p,
		html[data-theme="dark"] .path-detail-container p,
		html[data-theme="dark"] .path-detail-container li,
		html[data-theme="dark"] .footer-inner,
		html[data-theme="dark"] .footer-links a,
		html[data-theme="dark"] .main-nav a,
		html[data-theme="dark"] .hero-stats span {
			color: #98a2b3;
		}

		html[data-theme="dark"] .main-nav,
		html[data-theme="dark"] .header-profile-trigger,
		html[data-theme="dark"] .header-profile-dropdown,
		html[data-theme="dark"] .theme-toggle {
			background: rgba(24, 28, 37, 0.84);
			border-color: rgba(148, 163, 184, 0.22);
			box-shadow: 0 12px 28px rgba(2, 6, 23, 0.22);
			color: #e2e8f0;
		}

		html[data-theme="dark"] .header-profile-trigger {
			background: linear-gradient(135deg, rgba(24, 28, 37, 0.92), rgba(15, 118, 110, 0.18));
			border-color: rgba(45, 212, 191, 0.20);
			box-shadow: 0 16px 36px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.06);
		}

		html[data-theme="dark"] .header-profile-trigger:hover,
		html[data-theme="dark"] .header-profile-menu.is-open .header-profile-trigger {
			border-color: rgba(45, 212, 191, 0.36);
			box-shadow: 0 22px 48px rgba(2, 6, 23, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08);
		}

		html[data-theme="dark"] .header-profile-dropdown {
			background: rgba(17, 24, 39, 0.92);
			border-color: rgba(148, 163, 184, 0.18);
			box-shadow: 0 28px 70px rgba(2, 6, 23, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.06);
		}

		html[data-theme="dark"] .header-profile-dropdown::before {
			background: rgba(17, 24, 39, 0.92);
			border-color: rgba(148, 163, 184, 0.18);
		}

		html[data-theme="dark"] .main-nav a:hover {
			color: #f8fafc;
			background: rgba(49, 58, 74, 0.72);
		}

		html[data-theme="dark"] .header-profile-meta strong,
		html[data-theme="dark"] .header-profile-card strong,
		html[data-theme="dark"] .header-profile-link {
			color: #f8fafc;
		}

		html[data-theme="dark"] .header-profile-meta span,
		html[data-theme="dark"] .header-profile-card span:not(.header-profile-avatar) {
			color: #98a2b3;
		}

		html[data-theme="dark"] .header-profile-caret {
			border-color: #98a2b3;
		}

		html[data-theme="dark"] .header-profile-link:hover {
			background: rgba(20, 184, 166, 0.12);
			color: #99f6e4;
		}

		html[data-theme="dark"] .header-profile-link.logout {
			color: #fca5a5;
		}

		html[data-theme="dark"] .header-profile-link.logout:hover {
			background: rgba(239, 68, 68, 0.12);
			color: #fecaca;
		}

		html[data-theme="dark"] .header-profile-card {
			background: linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(37, 99, 235, 0.10));
			border-color: rgba(148, 163, 184, 0.14);
		}

		html[data-theme="dark"] .main-nav a.active {
			color: #f8fafc;
			background: linear-gradient(135deg, rgba(45, 212, 191, 0.20), rgba(56, 189, 248, 0.12));
			box-shadow: 0 8px 18px rgba(2, 6, 23, 0.32);
		}

		html[data-theme="dark"] .nav-toggle span {
			background: #e2e8f0;
		}

		html[data-theme="dark"] .theme-toggle-sun-center,
		html[data-theme="dark"] .theme-toggle-sun-rays {
			opacity: 0;
			transform: scale(0.72);
		}

		html[data-theme="dark"] .theme-toggle-moon {
			opacity: 1;
			transform: scale(1);
		}

		html[data-theme="dark"] .theme-toggle-moon::after {
			background: rgba(24, 28, 37, 0.84);
		}

		html[data-theme="dark"] .card-preview,
		html[data-theme="dark"] .course-card,
		html[data-theme="dark"] .about-grid > div:first-child,
		html[data-theme="dark"] .feature-list .feature,
		html[data-theme="dark"] .info-card,
		html[data-theme="dark"] .panel-card,
		html[data-theme="dark"] .feature-panel,
		html[data-theme="dark"] .profile-stat-card,
		html[data-theme="dark"] .profile-list-item,
		html[data-theme="dark"] .profile-highlight-card,
		html[data-theme="dark"] .auth-social-button,
		html[data-theme="dark"] .auth-preview-card,
		html[data-theme="dark"] .resource-card,
		html[data-theme="dark"] .playlist-card,
		html[data-theme="dark"] .note-card,
		html[data-theme="dark"] .roadmap-content,
		html[data-theme="dark"] .contact-item,
		html[data-theme="dark"] .benefit-item,
		html[data-theme="dark"] .hero-stats div,
		html[data-theme="dark"] .path-detail-container .project-card,
		html[data-theme="dark"] .path-detail-container .career-card,
		html[data-theme="dark"] .path-detail-container .resource-card,
		html[data-theme="dark"] .path-detail-container .skill-item,
		html[data-theme="dark"] .path-detail-container .roadmap-phase,
		html[data-theme="dark"] .path-detail-container .step,
		html[data-theme="dark"] .path-detail-container .course-card {
			background: linear-gradient(180deg, rgba(28, 32, 42, 0.92), rgba(22, 26, 35, 0.92));
			border-color: rgba(148, 163, 184, 0.12);
			box-shadow: 0 18px 40px rgba(2, 6, 23, 0.36);
		}

		html[data-theme="dark"] .filter-controls,
		html[data-theme="dark"] .hero-metrics div,
		html[data-theme="dark"] .search-input-wrapper,
		html[data-theme="dark"] .tag-chip,
		html[data-theme="dark"] .project-tech span,
		html[data-theme="dark"] .course-tags span,
		html[data-theme="dark"] .level.beginner,
		html[data-theme="dark"] .level.intermediate,
		html[data-theme="dark"] .level.advanced,
		html[data-theme="dark"] .difficulty.beginner,
		html[data-theme="dark"] .difficulty.intermediate,
		html[data-theme="dark"] .difficulty.advanced {
			background: rgba(26, 31, 41, 0.88);
			border-color: rgba(148, 163, 184, 0.14);
			box-shadow: 0 12px 30px rgba(2, 6, 23, 0.22);
		}

		html[data-theme="dark"] .path-icon,
		html[data-theme="dark"] .career-icon,
		html[data-theme="dark"] .roadmap-marker {
			background: linear-gradient(135deg, #14b8a6, #0ea5e9);
			box-shadow: 0 12px 28px rgba(14, 165, 233, 0.22);
		}

		html[data-theme="dark"] .section-link,
		html[data-theme="dark"] .btn-secondary,
		html[data-theme="dark"] .btn-outline,
		html[data-theme="dark"] #searchInput,
		html[data-theme="dark"] .search-input,
		html[data-theme="dark"] .select-filter,
		html[data-theme="dark"] .suggestions-box,
		html[data-theme="dark"] .password-toggle,
		html[data-theme="dark"] .form-card input,
		html[data-theme="dark"] .form-card textarea,
		html[data-theme="dark"] .form-card select {
			background: rgba(26, 31, 41, 0.96);
			border-color: rgba(148, 163, 184, 0.14);
			color: #e2e8f0;
			box-shadow: 0 12px 24px rgba(2, 6, 23, 0.22);
		}

		html[data-theme="dark"] .search-input-wrapper {
			border-style: solid;
		}

		html[data-theme="dark"] #searchInput::placeholder,
		html[data-theme="dark"] .search-input::placeholder,
		html[data-theme="dark"] .form-card input::placeholder,
		html[data-theme="dark"] .form-card textarea::placeholder {
			color: #64748b;
		}

		html[data-theme="dark"] .suggestion-item {
			color: #e2e8f0;
		}

		html[data-theme="dark"] .suggestion-item + .suggestion-item {
			border-top-color: rgba(51, 65, 85, 0.7);
		}

		html[data-theme="dark"] .suggestion-item:hover {
			background: rgba(39, 47, 61, 0.94);
			color: #f8fafc;
		}

		html[data-theme="dark"] .section-kicker,
		html[data-theme="dark"] .preview-meta span,
		html[data-theme="dark"] .video-count,
		html[data-theme="dark"] .note-tag,
		html[data-theme="dark"] .profile-highlight-card span {
			background: rgba(45, 212, 191, 0.14);
			color: #99f6e4;
		}

		html[data-theme="dark"] .site-footer {
			border-top-color: rgba(148, 163, 184, 0.12);
		}

		html[data-theme="dark"] .hero-eyebrow,
		html[data-theme="dark"] .hero-badge,
		html[data-theme="dark"] .resource-card .meta,
		html[data-theme="dark"] .playlist-card .duration,
		html[data-theme="dark"] .lessons,
		html[data-theme="dark"] .login-link,
		html[data-theme="dark"] .form-note,
		html[data-theme="dark"] .auth-divider span {
			color: #b1bac8;
		}

		html[data-theme="dark"] .hero-eyebrow,
		html[data-theme="dark"] .hero-badge,
		html[data-theme="dark"] .contact-item,
		html[data-theme="dark"] .benefit-item,
		html[data-theme="dark"] .hero-stats div {
			border-color: rgba(148, 163, 184, 0.12);
		}

		html[data-theme="dark"] .btn-primary,
		html[data-theme="dark"] .main-nav a.cta,
		html[data-theme="dark"] .btn-watch {
			background: linear-gradient(135deg, #14b8a6, #0ea5e9);
			box-shadow: 0 14px 28px rgba(20, 184, 166, 0.22);
		}

		html[data-theme="dark"] .btn-secondary:hover,
		html[data-theme="dark"] .btn-outline:hover,
		html[data-theme="dark"] .section-link:hover {
			background: rgba(41, 49, 63, 0.92);
			color: #f8fafc;
		}

		html[data-theme="dark"] .hero-eyebrow,
		html[data-theme="dark"] .section-link,
		html[data-theme="dark"] .btn-secondary,
		html[data-theme="dark"] .btn-outline {
			background-color: rgba(26, 31, 41, 0.88);
		}

		html[data-theme="dark"] .hero-eyebrow,
		html[data-theme="dark"] .hero-badge {
			background: rgba(45, 212, 191, 0.12);
			color: #99f6e4;
		}

		html[data-theme="dark"] .preview-badge {
			background: rgba(45, 212, 191, 0.12);
			color: #a7f3d0;
		}

		html[data-theme="dark"] .search-icon,
		html[data-theme="dark"] .resource-card i,
		html[data-theme="dark"] .skill-item i,
		html[data-theme="dark"] .contact-link,
		html[data-theme="dark"] .resource-main h3 a {
			color: #7dd3fc;
		}

		html[data-theme="dark"] .resource-card::after {
			background: radial-gradient(circle, rgba(45, 212, 191, 0.10), transparent 70%);
		}

		html[data-theme="dark"] .tag-chip {
			color: #d8dee9;
		}

		html[data-theme="dark"] .tag-chip:hover {
			background: rgba(36, 44, 58, 0.96);
			border-color: rgba(125, 211, 252, 0.22);
		}

		html[data-theme="dark"] .tag-chip.active {
			background: linear-gradient(135deg, #14b8a6, #0284c7);
			color: #f8fafc;
			border-color: transparent;
			box-shadow: 0 14px 28px rgba(14, 165, 233, 0.22);
		}

		html[data-theme="dark"] .project-tech span,
		html[data-theme="dark"] .course-tags span,
		html[data-theme="dark"] .lessons {
			color: #b1bac8;
		}

		html[data-theme="dark"] .level.beginner,
		html[data-theme="dark"] .difficulty.beginner {
			color: #86efac;
		}

		html[data-theme="dark"] .level.intermediate,
		html[data-theme="dark"] .difficulty.intermediate {
			color: #fcd34d;
		}

		html[data-theme="dark"] .level.advanced,
		html[data-theme="dark"] .difficulty.advanced {
			color: #fda4af;
		}

		html[data-theme="dark"] .roadmap-item:not(:last-child)::before {
			background: rgba(148, 163, 184, 0.18);
		}

		html[data-theme="dark"] .btn-primary:hover,
		html[data-theme="dark"] .main-nav a.cta:hover,
		html[data-theme="dark"] .btn-watch:hover {
			background: linear-gradient(135deg, #0f766e, #0284c7);
			box-shadow: 0 18px 34px rgba(14, 165, 233, 0.22);
		}

		html[data-theme="dark"] .section-link,
		html[data-theme="dark"] .btn-secondary,
		html[data-theme="dark"] .btn-outline,
		html[data-theme="dark"] .contact-link,
		html[data-theme="dark"] .courses-link {
			color: #dbe4f0;
		}

		html[data-theme="dark"] .contact-link:hover,
		html[data-theme="dark"] .footer-links a:hover,
		html[data-theme="dark"] .courses-link:hover {
			color: #7dd3fc;
		}

		@media (max-width: 768px) {
			.theme-toggle {
				margin-left: auto;
				margin-right: 10px;
				width: 40px;
				height: 40px;
			}

			.theme-toggle-icon {
				width: 22px;
				height: 22px;
			}

			.theme-toggle-moon::after {
				top: 2px;
				left: 8px;
				width: 16px;
				height: 16px;
			}

			.resources-hero,
			.path-header {
				padding: 22px;
				border-radius: 24px;
			}

			.filter-controls {
				padding: 16px;
				border-radius: 20px;
			}
		}
	`;

	document.head.appendChild(style);
}

function getPreferredTheme() {
	const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
	if (savedTheme === DARK_THEME || savedTheme === LIGHT_THEME) {
		return savedTheme;
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
}

function applyTheme(theme) {
	document.documentElement.setAttribute('data-theme', theme);
	localStorage.setItem(THEME_STORAGE_KEY, theme);
}

applyTheme(getPreferredTheme());
loadLearnerScript();
loadAuthScript();

document.addEventListener('DOMContentLoaded', function() {
	injectThemeStyles();

	const navToggle = document.getElementById('navToggle');
	const mainNav = document.getElementById('mainNav');
	const headerInner = document.querySelector('.header-inner');
	let themeToggle = document.getElementById('themeToggle');

	if (headerInner && !themeToggle) {
		themeToggle = document.createElement('button');
		themeToggle.type = 'button';
		themeToggle.id = 'themeToggle';
		themeToggle.className = 'theme-toggle';
		themeToggle.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true"><span class="theme-toggle-sun-rays"></span><span class="theme-toggle-sun-center"></span><span class="theme-toggle-moon"></span></span>';

		if (navToggle) {
			headerInner.insertBefore(themeToggle, navToggle);
		} else if (mainNav) {
			headerInner.insertBefore(themeToggle, mainNav);
		} else {
			headerInner.appendChild(themeToggle);
		}
	}

	if (themeToggle) {
		const syncThemeButton = function() {
			const isDark = document.documentElement.getAttribute('data-theme') === DARK_THEME;
			themeToggle.setAttribute('aria-pressed', String(isDark));
			themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
			themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
		};

		syncThemeButton();

		themeToggle.addEventListener('click', function() {
			const nextTheme = document.documentElement.getAttribute('data-theme') === DARK_THEME ? LIGHT_THEME : DARK_THEME;
			applyTheme(nextTheme);
			syncThemeButton();
		});
	}

	if (navToggle && mainNav) {
		navToggle.setAttribute('aria-expanded', 'false');

		const closeMenu = function() {
			navToggle.classList.remove('active');
			mainNav.classList.remove('active');
			navToggle.setAttribute('aria-expanded', 'false');
		};

		navToggle.addEventListener('click', function() {
			const isOpen = mainNav.classList.toggle('active');
			navToggle.classList.toggle('active', isOpen);
			navToggle.setAttribute('aria-expanded', String(isOpen));
		});

		const navLinks = mainNav.querySelectorAll('a');
		navLinks.forEach(link => {
			link.addEventListener('click', function() {
				closeMenu();
			});
		});

		document.addEventListener('click', function(event) {
			const isClickInside = mainNav.contains(event.target) || navToggle.contains(event.target);
			if (!isClickInside && mainNav.classList.contains('active')) {
				closeMenu();
			}
		});

		window.addEventListener('resize', function() {
			if (window.innerWidth > 768 && mainNav.classList.contains('active')) {
				closeMenu();
			}
		});
	}
});
