const OPENLEARN_GUEST_STATE_KEY = 'openlearn-learner-state';
const OPENLEARN_REMEMBERED_EMAIL_KEY = 'openlearn-remembered-email';

(function() {
	const authState = {
		user: null,
		learnerState: null,
		authenticated: false
	};

	function readJson(key, fallback) {
		try {
			const raw = localStorage.getItem(key);
			return raw ? JSON.parse(raw) : fallback;
		} catch (error) {
			return fallback;
		}
	}

	function writeJson(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
	}

	function clearGuestLearnerState() {
		localStorage.removeItem(OPENLEARN_GUEST_STATE_KEY);
	}

	function getGuestLearnerState() {
		const state = readJson(OPENLEARN_GUEST_STATE_KEY, {});
		return sanitizeLearnerState(state);
	}

	function setGuestLearnerState(state) {
		writeJson(OPENLEARN_GUEST_STATE_KEY, sanitizeLearnerState(state));
	}

	function sanitizeLearnerState(state) {
		const safeState = state && typeof state === 'object' ? state : {};
		return {
			saved: Array.isArray(safeState.saved) ? safeState.saved : [],
			progress: safeState.progress && typeof safeState.progress === 'object' ? safeState.progress : {},
			recent: Array.isArray(safeState.recent) ? safeState.recent : []
		};
	}

	function setAuthState(payload) {
		authState.authenticated = Boolean(payload && payload.authenticated);
		authState.user = payload && payload.user ? payload.user : null;
		authState.learnerState = sanitizeLearnerState(payload && payload.learnerState ? payload.learnerState : {});
		if (authState.authenticated) {
			setGuestLearnerState(authState.learnerState);
		}
		window.__openLearnAuthState = authState;
	}

	function escapeHtml(value) {
		return String(value || '').replace(/[&<>"']/g, function(character) {
			return {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			}[character];
		});
	}

	function normalizeEmail(value) {
		return String(value || '').trim().toLowerCase();
	}

	function setSubmitState(form, isSubmitting, label) {
		const button = form ? form.querySelector('button[type="submit"]') : null;
		if (!button) {
			return;
		}

		if (!button.dataset.defaultText) {
			button.dataset.defaultText = button.textContent;
		}

		button.disabled = isSubmitting;
		button.textContent = isSubmitting ? label : button.dataset.defaultText;
	}

	function getPasswordStrength(password) {
		let score = 0;
		if (password.length >= 8) {
			score += 1;
		}
		if (password.length >= 10) {
			score += 1;
		}
		if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
			score += 1;
		}
		if (/\d/.test(password)) {
			score += 1;
		}
		if (/[^A-Za-z0-9]/.test(password)) {
			score += 1;
		}

		if (!password) {
			return { className: '', message: 'Use at least 8 characters with a letter and number.' };
		}
		if (score <= 1) {
			return { className: 'is-weak', message: 'Weak password. Add more detail.' };
		}
		if (score <= 3) {
			return { className: 'is-good', message: 'Good password. A number or symbol makes it stronger.' };
		}
		return { className: 'is-strong', message: 'Strong password.' };
	}

	function getPageName() {
		return window.location.pathname.split('/').pop().toLowerCase();
	}

	function isPage(name) {
		return getPageName() === name.toLowerCase();
	}

	function formatDate(value) {
		if (!value) {
			return 'Recently joined';
		}

		try {
			return new Date(value).toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch (error) {
			return 'Recently joined';
		}
	}

	function getInitials(name) {
		const parts = String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
		if (!parts.length) {
			return 'OL';
		}

		return parts.map((part) => part.charAt(0).toUpperCase()).join('');
	}

	function setStatus(element, message, tone) {
		if (!element) {
			return;
		}

		element.textContent = message;
		element.className = `form-status${tone ? ` ${tone}` : ''}`;
	}

	function goTo(path) {
		window.location.href = path;
	}

	async function apiRequest(url, options = {}) {
		const response = await fetch(url, {
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				...(options.headers || {})
			},
			...options
		});

		const raw = await response.text();
		const data = raw ? JSON.parse(raw) : {};
		if (!response.ok) {
			throw new Error(data.error || 'Request failed.');
		}

		return data;
	}

	async function refreshSession() {
		try {
			const data = await apiRequest('/api/auth/session', { method: 'GET' });
			setAuthState(data);
		} catch (error) {
			setAuthState({ authenticated: false, learnerState: getGuestLearnerState() });
		}

		return authState;
	}

	async function saveRemoteLearnerState(state) {
		const learnerState = sanitizeLearnerState(state);
		if (!authState.authenticated) {
			setGuestLearnerState(learnerState);
			return learnerState;
		}

		const data = await apiRequest('/api/learner-state', {
			method: 'PUT',
			body: JSON.stringify({ learnerState })
		});
		setAuthState({
			authenticated: true,
			user: authState.user,
			learnerState: data.learnerState
		});
		return authState.learnerState;
	}

	function closeProfileMenu(menu) {
		if (!menu) {
			return;
		}

		menu.classList.remove('is-open');
		const trigger = menu.querySelector('.header-profile-trigger');
		if (trigger) {
			trigger.setAttribute('aria-expanded', 'false');
		}
	}

	function updateNavForAuth() {
		const nav = document.getElementById('mainNav');
		const headerInner = document.querySelector('.header-inner');
		if (!nav) {
			return;
		}

		const currentUser = authState.user;
		const cta = nav.querySelector('a.cta');
		const oldProfileMenu = document.getElementById('headerProfileMenu');
		if (oldProfileMenu) {
			oldProfileMenu.remove();
		}

		if (!cta) {
			return;
		}

		if (!authState.authenticated || !currentUser) {
			cta.href = 'signup.html';
			cta.textContent = 'Get Started';
			cta.hidden = false;
			if (isPage('signup.html')) {
				cta.classList.add('active');
				cta.setAttribute('aria-current', 'page');
			} else {
				cta.classList.remove('active');
				cta.removeAttribute('aria-current');
			}
			return;
		}

		cta.hidden = true;
		if (!headerInner) {
			return;
		}

		const profileMenu = document.createElement('div');
		profileMenu.id = 'headerProfileMenu';
		profileMenu.className = 'header-profile-menu';
		profileMenu.innerHTML = `
			<button type="button" class="header-profile-trigger" aria-haspopup="menu" aria-expanded="false" aria-label="Open profile menu">
				<span class="header-profile-avatar-wrap">
					<span class="header-profile-avatar">${escapeHtml(getInitials(currentUser.name))}</span>
					<span class="header-profile-status" aria-hidden="true"></span>
				</span>
				<span class="header-profile-meta">
					<strong>${escapeHtml(currentUser.name)}</strong>
					<span>${escapeHtml(currentUser.email)}</span>
				</span>
				<span class="header-profile-caret" aria-hidden="true"></span>
			</button>
			<div class="header-profile-dropdown" role="menu">
				<div class="header-profile-card">
					<span class="header-profile-avatar large">${escapeHtml(getInitials(currentUser.name))}</span>
					<div>
						<strong>${escapeHtml(currentUser.name)}</strong>
						<span>${escapeHtml(currentUser.email)}</span>
					</div>
				</div>
				<a href="profile.html" role="menuitem" class="header-profile-link">
					<span class="header-profile-link-icon profile" aria-hidden="true"></span>
					<span>View profile</span>
				</a>
				<button type="button" role="menuitem" class="header-profile-link logout" data-auth-action="logout">
					<span class="header-profile-link-icon logout" aria-hidden="true"></span>
					<span>Log out</span>
				</button>
			</div>
		`;

		const themeToggle = document.getElementById('themeToggle');
		if (themeToggle) {
			headerInner.insertBefore(profileMenu, themeToggle);
		} else {
			headerInner.appendChild(profileMenu);
		}

		const trigger = profileMenu.querySelector('.header-profile-trigger');
		const logoutButton = profileMenu.querySelector('[data-auth-action="logout"]');

		trigger.addEventListener('click', function(event) {
			event.preventDefault();
			const isOpen = profileMenu.classList.toggle('is-open');
			trigger.setAttribute('aria-expanded', String(isOpen));
		});

		logoutButton.addEventListener('click', async function(event) {
			event.preventDefault();
			try {
				await apiRequest('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) });
			} catch (error) {
				// Ignore logout transport errors and still clear local UI state.
			}
			setAuthState({ authenticated: false, learnerState: getGuestLearnerState() });
			goTo('index.html');
		});

		document.addEventListener('click', function(event) {
			if (!profileMenu.contains(event.target)) {
				closeProfileMenu(profileMenu);
			}
		});

		document.addEventListener('keydown', function(event) {
			if (event.key === 'Escape') {
				closeProfileMenu(profileMenu);
			}
		});
	}

	function bindSignupForm() {
		const form = document.getElementById('signupForm');
		if (!form) {
			return;
		}

		const status = document.getElementById('signupStatus');
		const passwordInput = document.getElementById('signup-password');
		const strength = document.getElementById('passwordStrength');

		if (passwordInput && strength) {
			passwordInput.addEventListener('input', function() {
				const result = getPasswordStrength(passwordInput.value);
				strength.className = `password-strength ${result.className}`.trim();
				const message = strength.querySelector('small');
				if (message) {
					message.textContent = result.message;
				}
			});
		}

		form.addEventListener('submit', async function(event) {
			event.preventDefault();

			const name = document.getElementById('signup-name').value.trim();
			const email = normalizeEmail(document.getElementById('signup-email').value);
			const password = document.getElementById('signup-password').value;
			const confirmPassword = document.getElementById('signup-confirm-password').value;

			if (!name || !email || !password || !confirmPassword) {
				setStatus(status, 'Please fill in all fields.', 'error');
				return;
			}

			if (password.length < 8) {
				setStatus(status, 'Use at least 8 characters for your password.', 'error');
				return;
			}

			if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
				setStatus(status, 'Use at least one letter and one number.', 'error');
				return;
			}

			if (password !== confirmPassword) {
				setStatus(status, 'Your passwords do not match.', 'error');
				return;
			}

			try {
				setSubmitState(form, true, 'Creating account...');
				const data = await apiRequest('/api/auth/signup', {
					method: 'POST',
					body: JSON.stringify({
						name,
						email,
						password,
						learnerState: getGuestLearnerState()
					})
				});
				clearGuestLearnerState();
				setAuthState({
					authenticated: true,
					user: data.user,
					learnerState: data.learnerState
				});
				setStatus(status, 'Account created. Opening your profile...', 'success');
				setTimeout(function() {
					goTo('profile.html');
				}, 400);
			} catch (error) {
				setStatus(status, error.message, 'error');
			} finally {
				setSubmitState(form, false);
			}
		});
	}

	function bindLoginForm() {
		const form = document.getElementById('loginForm');
		if (!form) {
			return;
		}

		const status = document.getElementById('loginStatus');
		const emailInput = document.getElementById('login-email');
		const rememberEmail = document.getElementById('remember-email');
		const forgotPasswordButton = document.getElementById('forgotPasswordButton');
		const savedEmail = localStorage.getItem(OPENLEARN_REMEMBERED_EMAIL_KEY);

		if (emailInput && rememberEmail && savedEmail) {
			emailInput.value = savedEmail;
			rememberEmail.checked = true;
		}

		if (forgotPasswordButton) {
			forgotPasswordButton.addEventListener('click', async function() {
				const email = normalizeEmail(emailInput.value);
				if (!email) {
					setStatus(status, 'Enter your email first, then request a reset link.', 'error');
					emailInput.focus();
					return;
				}

				try {
					forgotPasswordButton.disabled = true;
					forgotPasswordButton.textContent = 'Sending...';
					const data = await apiRequest('/api/auth/password-reset/request', {
						method: 'POST',
						body: JSON.stringify({ email })
					});
					if (data.resetUrl) {
						setStatus(status, `Reset link created: ${data.resetUrl}`, 'success');
					} else {
						setStatus(status, data.message || 'If that email exists, a reset link has been created.', 'success');
					}
				} catch (error) {
					setStatus(status, error.message, 'error');
				} finally {
					forgotPasswordButton.disabled = false;
					forgotPasswordButton.textContent = 'Forgot password?';
				}
			});
		}

		form.addEventListener('submit', async function(event) {
			event.preventDefault();

			const email = normalizeEmail(emailInput.value);
			const password = document.getElementById('login-password').value;

			if (!email || !password) {
				setStatus(status, 'Please enter your email and password.', 'error');
				return;
			}

			try {
				setSubmitState(form, true, 'Logging in...');
				const data = await apiRequest('/api/auth/login', {
					method: 'POST',
					body: JSON.stringify({
						email,
						password,
						learnerState: getGuestLearnerState()
					})
				});
				clearGuestLearnerState();
				setAuthState({
					authenticated: true,
					user: data.user,
					learnerState: data.learnerState
				});
				if (rememberEmail && rememberEmail.checked) {
					localStorage.setItem(OPENLEARN_REMEMBERED_EMAIL_KEY, email);
				} else {
					localStorage.removeItem(OPENLEARN_REMEMBERED_EMAIL_KEY);
				}
				setStatus(status, 'Welcome back. Opening your profile...', 'success');
				setTimeout(function() {
					goTo('profile.html');
				}, 400);
			} catch (error) {
				setStatus(status, error.message, 'error');
			} finally {
				setSubmitState(form, false);
			}
		});
	}

	function bindSocialAuthButtons() {
		const buttons = document.querySelectorAll('[data-auth-provider="google"]');
		buttons.forEach((button) => {
			button.addEventListener('click', function() {
				const status = document.getElementById('loginStatus') || document.getElementById('signupStatus');
				setStatus(
					status,
					'Google sign-in needs a real OAuth setup on the backend. It is not connected yet.',
					'error'
				);
			});
		});
	}

	function bindPasswordToggles() {
		document.querySelectorAll('[data-password-toggle]').forEach((button) => {
			button.addEventListener('click', function() {
				const inputId = button.getAttribute('data-password-toggle');
				const input = document.getElementById(inputId);
				if (!input) {
					return;
				}

				const showing = input.type === 'text';
				input.type = showing ? 'password' : 'text';
				button.textContent = showing ? 'Show' : 'Hide';
			});
		});
	}

	function bindResetPasswordForm() {
		const form = document.getElementById('resetPasswordForm');
		if (!form) {
			return;
		}

		const status = document.getElementById('resetPasswordStatus');
		const tokenInput = document.getElementById('reset-token');
		const params = new URLSearchParams(window.location.search);
		const token = params.get('token') || '';
		if (tokenInput) {
			tokenInput.value = token;
		}

		if (!token) {
			setStatus(status, 'This reset link is missing a token. Request a new link from the login page.', 'error');
		}

		form.addEventListener('submit', async function(event) {
			event.preventDefault();

			const password = document.getElementById('reset-password').value;
			const confirmPassword = document.getElementById('reset-confirm-password').value;

			if (!token || !password || !confirmPassword) {
				setStatus(status, 'Reset token and new password are required.', 'error');
				return;
			}

			if (password.length < 8) {
				setStatus(status, 'Use at least 8 characters for your password.', 'error');
				return;
			}

			if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
				setStatus(status, 'Use at least one letter and one number.', 'error');
				return;
			}

			if (password !== confirmPassword) {
				setStatus(status, 'Your passwords do not match.', 'error');
				return;
			}

			try {
				setSubmitState(form, true, 'Resetting...');
				await apiRequest('/api/auth/password-reset/confirm', {
					method: 'POST',
					body: JSON.stringify({
						token,
						password,
						confirmPassword
					})
				});
				setStatus(status, 'Password reset. Sending you to login...', 'success');
				setTimeout(function() {
					goTo('login.html');
				}, 700);
			} catch (error) {
				setStatus(status, error.message, 'error');
			} finally {
				setSubmitState(form, false);
			}
		});
	}

	function createRecentMarkup(items) {
		if (!items.length) {
			return '<p class="profile-empty">Your recently viewed courses and paths will appear here.</p>';
		}

		return `<div class="profile-list">${items.map((item) => `
			<a class="profile-list-item" href="${escapeHtml(item.link)}">
				<strong>${escapeHtml(item.title)}</strong>
				<span>${escapeHtml(formatKindLabel(item.kind))}</span>
			</a>
		`).join('')}</div>`;
	}

	function createSavedMarkup(items) {
		if (!items.length) {
			return '<p class="profile-empty">Saved items will show up here after you bookmark courses or learning paths.</p>';
		}

		return `<div class="profile-list">${items.map((item) => `
			<a class="profile-list-item" href="${escapeHtml(item.link)}">
				<strong>${escapeHtml(item.title)}</strong>
				<span>${escapeHtml(formatKindLabel(item.kind))}</span>
			</a>
		`).join('')}</div>`;
	}

	function formatKindLabel(kind) {
		if (kind === 'path') return 'Learning path';
		if (kind === 'career') return 'Career guide';
		if (kind === 'course') return 'Course';
		return 'Learning item';
	}

	function getLearningScore(learnerState) {
		const progressEntries = Object.values(learnerState.progress || {});
		const completedCount = progressEntries.filter((entry) => entry.completed).length;
		return Math.min(100, Math.round((completedCount * 24) + (progressEntries.length * 8) + (learnerState.saved.length * 4) + (learnerState.recent.length * 3)));
	}

	function getNextStep(learnerState) {
		const progressEntries = Object.values(learnerState.progress || {})
			.filter((entry) => !entry.completed)
			.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

		if (progressEntries.length) {
			return {
				title: progressEntries[0].title,
				link: progressEntries[0].link,
				label: 'Continue now',
				copy: 'Pick up from your latest in-progress item.'
			};
		}

		if (learnerState.saved.length) {
			return {
				title: learnerState.saved[0].title,
				link: learnerState.saved[0].link,
				label: 'Open saved item',
				copy: 'Start with the first item in your shortlist.'
			};
		}

		return {
			title: 'Choose your first learning path',
			link: 'paths.html',
			label: 'Explore paths',
			copy: 'Start with a clear path and your dashboard will fill in as you learn.'
		};
	}

	function createProgressMarkup(progressEntries) {
		const activeItems = progressEntries
			.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
			.slice(0, 4);

		if (!activeItems.length) {
			return `
				<div class="dashboard-empty-state">
					<strong>No progress yet</strong>
					<p>Open a course, path, or career guide and OpenLearn will start tracking your journey.</p>
					<a class="btn-secondary" href="courses.html">Browse Courses</a>
				</div>
			`;
		}

		return `<div class="dashboard-progress-list">${activeItems.map((item) => {
			const visits = item.visits || 1;
			const percent = item.completed ? 100 : Math.min(88, 28 + visits * 18);
			return `
				<a class="dashboard-progress-item" href="${escapeHtml(item.link)}">
					<div>
						<span>${escapeHtml(formatKindLabel(item.kind))}</span>
						<strong>${escapeHtml(item.title)}</strong>
					</div>
					<div class="dashboard-progress-meter" aria-label="${percent}% complete">
						<span style="width:${percent}%"></span>
					</div>
					<small>${item.completed ? 'Completed' : `${visits} visit${visits === 1 ? '' : 's'}`}</small>
				</a>
			`;
		}).join('')}</div>`;
	}

	function createRecommendationMarkup(learnerState) {
		const hasWebActivity = [...learnerState.saved, ...learnerState.recent, ...Object.values(learnerState.progress || {})]
			.some((item) => /web|javascript|react|frontend|html|css/i.test(`${item.title || ''} ${item.kind || ''}`));
		const hasDataActivity = [...learnerState.saved, ...learnerState.recent, ...Object.values(learnerState.progress || {})]
			.some((item) => /data|machine|python|visual/i.test(`${item.title || ''} ${item.kind || ''}`));

		const picks = hasDataActivity
			? [
				{ title: 'Database Design and SQL', link: 'courses/data-base/database.html', kind: 'course' },
				{ title: 'Data Science and ML Path', link: 'paths/data-science-ml.html', kind: 'path' },
				{ title: 'Cloud Computing Essentials', link: 'courses/cloud/cloud.html', kind: 'course' }
			]
			: hasWebActivity
				? [
					{ title: 'Frontend Development with React', link: 'courses/react/react.html', kind: 'course' },
					{ title: 'Backend Development', link: 'courses/nodejs/nodejs.html', kind: 'course' },
					{ title: 'Responsive Web Design', link: 'courses/rwd/rwd.html', kind: 'course' }
				]
				: [
					{ title: 'Responsive Web Design', link: 'courses/rwd/rwd.html', kind: 'course' },
					{ title: 'Python Programming', link: 'courses/phython/phython.html', kind: 'course' },
					{ title: 'Backend Developer Path', link: 'paths/backend.html', kind: 'path' }
				];

		return `<div class="dashboard-recommendations">${picks.map((item) => `
			<a class="dashboard-recommendation" href="${escapeHtml(item.link)}">
				<span>${escapeHtml(formatKindLabel(item.kind))}</span>
				<strong>${escapeHtml(item.title)}</strong>
			</a>
		`).join('')}</div>`;
	}

	function createProfileHighlights(learnerState) {
		const progressEntries = Object.values(learnerState.progress || {});
		const inProgress = progressEntries.filter((entry) => !entry.completed).slice(0, 3);
		const recent = learnerState.recent.slice(0, 3);
		const highlights = (inProgress.length ? inProgress : recent).slice(0, 3);

		if (!highlights.length) {
			return `
				<div class="profile-highlights">
					<div class="profile-highlight-card empty">
						<span>Start learning</span>
						<strong>Your activity highlights will appear here.</strong>
					</div>
				</div>
			`;
		}

		return `
			<div class="profile-highlights">
				${highlights.map((item) => `
					<a class="profile-highlight-card" href="${escapeHtml(item.link)}">
						<span>${escapeHtml(formatKindLabel(item.kind))}</span>
						<strong>${escapeHtml(item.title)}</strong>
					</a>
				`).join('')}
			</div>
		`;
	}

	function createActivityGrid(savedItems, recentItems) {
		const cards = [...savedItems, ...recentItems].slice(0, 6);
		if (!cards.length) {
			return '<p class="profile-empty">Explore courses and paths, then your learning grid will start filling up.</p>';
		}

		return `
			<div class="profile-activity-grid">
				${cards.map((item, index) => `
					<a class="profile-activity-tile tile-${(index % 6) + 1}" href="${escapeHtml(item.link)}">
						<span>${escapeHtml(formatKindLabel(item.kind))}</span>
						<strong>${escapeHtml(item.title)}</strong>
					</a>
				`).join('')}
			</div>
		`;
	}

	function bindProfileSettings() {
		const profileForm = document.getElementById('profileSettingsForm');
		const passwordForm = document.getElementById('passwordSettingsForm');
		const logoutButton = document.getElementById('profileLogoutButton');
		bindPasswordToggles();

		if (profileForm) {
			const status = document.getElementById('profileSettingsStatus');
			profileForm.addEventListener('submit', async function(event) {
				event.preventDefault();
				const name = document.getElementById('profile-name').value.trim();
				const email = normalizeEmail(document.getElementById('profile-email').value);

				if (!name || !email) {
					setStatus(status, 'Name and email are required.', 'error');
					return;
				}

				try {
					const data = await apiRequest('/api/auth/profile', {
						method: 'PUT',
						body: JSON.stringify({ name, email })
					});
					setAuthState({
						authenticated: true,
						user: data.user,
						learnerState: authState.learnerState
					});
					updateNavForAuth();
					renderProfilePage();
					setStatus(document.getElementById('profileSettingsStatus'), 'Profile updated successfully.', 'success');
				} catch (error) {
					setStatus(status, error.message, 'error');
				}
			});
		}

		if (passwordForm) {
			const status = document.getElementById('passwordSettingsStatus');
			passwordForm.addEventListener('submit', async function(event) {
				event.preventDefault();
				const currentPassword = document.getElementById('current-password').value;
				const newPassword = document.getElementById('new-password').value;
				const confirmPassword = document.getElementById('confirm-password').value;

				if (newPassword.length < 8) {
					setStatus(status, 'Use at least 8 characters for your new password.', 'error');
					return;
				}

				if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
					setStatus(status, 'Use at least one letter and one number.', 'error');
					return;
				}

				try {
					await apiRequest('/api/auth/password', {
						method: 'PUT',
						body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
					});
					passwordForm.reset();
					setStatus(status, 'Password updated successfully.', 'success');
				} catch (error) {
					setStatus(status, error.message, 'error');
				}
			});
		}

		if (logoutButton) {
			logoutButton.addEventListener('click', async function() {
				try {
					await apiRequest('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) });
				} catch (error) {
					// Ignore logout transport errors and still return to home.
				}
				setAuthState({ authenticated: false, learnerState: getGuestLearnerState() });
				goTo('index.html');
			});
		}
	}

	function renderProfilePage() {
		if (!isPage('profile.html')) {
			return;
		}

		if (!authState.authenticated || !authState.user) {
			goTo('login.html');
			return;
		}

		const mount = document.getElementById('profileMount');
		if (!mount) {
			return;
		}

		const learnerState = sanitizeLearnerState(authState.learnerState || {});
		const progressEntries = Object.values(learnerState.progress || {});
		const completedCount = progressEntries.filter((entry) => entry.completed).length;
		const inProgressCount = progressEntries.filter((entry) => !entry.completed).length;
		const recentItems = learnerState.recent.slice(0, 4);
		const savedItems = learnerState.saved.slice(0, 4);
		const totalMoments = learnerState.saved.length + learnerState.recent.length + progressEntries.length;
		const learningScore = getLearningScore(learnerState);
		const nextStep = getNextStep(learnerState);
		const currentUser = authState.user;

		mount.innerHTML = `
			<section class="container profile-shell learner-dashboard-page">
				<section class="dashboard-hero">
					<div class="dashboard-identity">
						<div class="profile-avatar profile-avatar-large">${escapeHtml(getInitials(currentUser.name))}</div>
						<div>
							<span class="section-kicker">Welcome back</span>
							<h2>${escapeHtml(currentUser.name)}</h2>
							<p>${escapeHtml(currentUser.email)} | Member since ${escapeHtml(formatDate(currentUser.joinedAt))}</p>
						</div>
					</div>
					<div class="dashboard-score-card">
						<span>Learning score</span>
						<strong>${learningScore}</strong>
						<div class="dashboard-score-track"><span style="width:${learningScore}%"></span></div>
					</div>
				</section>

				<section class="dashboard-main-grid">
					<article class="dashboard-next-card">
						<span class="section-kicker">Next step</span>
						<h2>${escapeHtml(nextStep.title)}</h2>
						<p>${escapeHtml(nextStep.copy)}</p>
						<div class="dashboard-actions">
							<a class="btn-primary" href="${escapeHtml(nextStep.link)}">${escapeHtml(nextStep.label)}</a>
							<a class="btn-secondary" href="courses.html">Browse Courses</a>
							<a class="btn-outline" href="paths.html">Explore Paths</a>
						</div>
					</article>

					<div class="dashboard-stat-stack">
						<div class="profile-stat-card">
							<strong>${learnerState.saved.length}</strong>
							<span>Saved items</span>
						</div>
						<div class="profile-stat-card">
							<strong>${completedCount}</strong>
							<span>Completed</span>
						</div>
						<div class="profile-stat-card">
							<strong>${inProgressCount}</strong>
							<span>In progress</span>
						</div>
						<div class="profile-stat-card">
							<strong>${totalMoments}</strong>
							<span>Learning moments</span>
						</div>
					</div>
				</section>

				<section class="dashboard-content-grid">
					<article class="panel-card dashboard-progress-panel">
						<div class="profile-grid-header">
							<span class="section-kicker">Progress</span>
							<h2>Continue learning</h2>
						</div>
						${createProgressMarkup(progressEntries)}
					</article>

					<article class="panel-card dashboard-focus-panel">
						<span class="section-kicker">Recommended</span>
						<h2>Smart next picks</h2>
						${createRecommendationMarkup(learnerState)}
					</article>
				</section>

				<section class="dashboard-content-grid">
					<article class="panel-card">
						<span class="section-kicker">Collection</span>
						<h2>Your shortlist</h2>
						${createSavedMarkup(savedItems)}
					</article>
					<article class="panel-card">
						<span class="section-kicker">Recent</span>
						<h2>Recently viewed</h2>
						${createRecentMarkup(recentItems)}
					</article>
				</section>

				<article class="panel-card profile-grid-panel">
					<div class="profile-grid-header">
						<span class="section-kicker">Activity</span>
						<h2>Your learning grid</h2>
					</div>
					${createActivityGrid(savedItems, recentItems)}
				</article>

				<section class="dashboard-content-grid">
					<article class="panel-card">
						<span class="section-kicker">Settings</span>
						<h2>Edit your profile</h2>
						<form class="form-card" id="profileSettingsForm">
							<label for="profile-name">Name</label>
							<input id="profile-name" type="text" value="${escapeHtml(currentUser.name)}" />

							<label for="profile-email">Email</label>
							<input id="profile-email" type="email" value="${escapeHtml(currentUser.email)}" />

							<button type="submit" class="btn-primary">Save profile</button>
							<p id="profileSettingsStatus" class="form-status" aria-live="polite"></p>
						</form>
					</article>

					<article class="panel-card">
						<span class="section-kicker">Security</span>
						<h2>Change password</h2>
						<form class="form-card" id="passwordSettingsForm">
							<label for="current-password">Current password</label>
							<input id="current-password" type="password" />

							<label for="new-password">New password</label>
							<input id="new-password" type="password" />

							<label for="confirm-password">Confirm new password</label>
							<input id="confirm-password" type="password" />

							<button type="submit" class="btn-primary">Update password</button>
							<p id="passwordSettingsStatus" class="form-status" aria-live="polite"></p>
						</form>
					</article>
				</section>

				<div class="dashboard-footer-actions">
					<button type="button" class="btn-outline" id="profileLogoutButton">Log out</button>
				</div>
			</section>
		`;

		bindProfileSettings();
	}

	window.OpenLearnAuth = {
		getState: function() {
			return authState;
		},
		isAuthenticated: function() {
			return authState.authenticated;
		},
		getLearnerState: function() {
			return authState.authenticated ? sanitizeLearnerState(authState.learnerState) : getGuestLearnerState();
		},
		setLearnerState: saveRemoteLearnerState,
		refreshSession
	};

	window.__openLearnAuthReady = (async function() {
		await refreshSession();
		updateNavForAuth();
		bindSignupForm();
		bindLoginForm();
		bindSocialAuthButtons();
		bindPasswordToggles();
		bindResetPasswordForm();
		renderProfilePage();
		return authState;
	})();
})();
