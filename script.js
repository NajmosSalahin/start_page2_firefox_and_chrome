(function () {
	"use strict";

	/* ---------- clock ---------- */
	function updateClock() {
		var days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
		var m = new Date();
		var dateString =
			days[m.getDay()] +
			" " +
			("0" + (m.getMonth() + 1)).slice(-2) +
			"/" +
			("0" + m.getDate()).slice(-2) +
			"/" +
			m.getFullYear() +
			" " +
			("0" + m.getHours()).slice(-2) +
			":" +
			("0" + m.getMinutes()).slice(-2) +
			":" +
			("0" + m.getSeconds()).slice(-2);
		document.getElementById("time").textContent = dateString;
		setTimeout(updateClock, 1000);
	}
	updateClock();

	/* ---------- tabs ---------- */
	var buttons = document.querySelectorAll(".button[data-target]");

	function activate(targetId) {
		buttons.forEach(function (btn) {
			btn.classList.toggle("is-active", btn.dataset.target === targetId);
		});
		document.querySelectorAll("[data-tab]").forEach(function (el) {
			el.hidden = el.dataset.tab !== targetId;
		});
	}

	buttons.forEach(function (btn) {
		btn.addEventListener("click", function () {
			activate(btn.dataset.target);
		});
		btn.addEventListener("keydown", function (e) {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				activate(btn.dataset.target);
			}
		});
	});

	/* ---------- win95 desktop ---------- */
	function initWin95() {
		var win = document.getElementById("w95-window");
		if (!win) return;

		var pane = document.getElementById("main2");
		var desktop = pane.querySelector(".w95-desktop");
		var body = win.querySelector(".w95-body");
		var statusbar = document.getElementById("w95-statusbar");
		var taskbar = document.getElementById("w95-taskbar");
		var taskbtn = document.getElementById("w95-taskbtn");
		var launcher = document.getElementById("w95-launcher");
		var about = document.getElementById("w95-about");
		var aboutOk = document.getElementById("w95-about-ok");
		var aboutX = document.getElementById("w95-about-x");
		var ctxMenu = document.getElementById("w95-contextmenu");
		var menubar = document.getElementById("w95-menubar");
		var titlebar = win.querySelector(".w95-titlebar");
		var maxBtn = win.querySelector('[data-win-action="max"]');
		var shortcuts = Array.prototype.slice.call(win.querySelectorAll(".w95-body .w95-shortcut"));
		var defaultStatus = shortcuts.length + " object(s)";
		var selected = [];
		var statusOnHover = true;
		var maximized = false;
		var pos = { x: 0, y: 0 };
		var drag = null;

		/* --- zoom-aware helpers (maincontainer uses CSS zoom on wide screens) --- */
		function zoomFactor() {
			var rect = desktop.getBoundingClientRect();
			return desktop.offsetWidth ? rect.width / desktop.offsetWidth : 1;
		}

		/* --- statusbar --- */
		function setStatus(text) {
			statusbar.textContent = text;
		}

		function refreshStatus() {
			if (selected.length) setStatus(selected.length + " object(s) selected");
			else setStatus(defaultStatus);
		}

		function applySelection() {
			shortcuts.forEach(function (sc) {
				sc.classList.toggle("is-selected", selected.indexOf(sc) !== -1);
			});
			refreshStatus();
		}

		function clearSelection() {
			selected = [];
			applySelection();
		}

		function selectOnly(sc) {
			selected = sc ? [sc] : [];
			applySelection();
		}

		function toggleSelect(sc) {
			var i = selected.indexOf(sc);
			if (i === -1) selected.push(sc);
			else selected.splice(i, 1);
			applySelection();
		}

		/* --- icon behaviour: single click opens, ctrl+click selects, hover reports --- */
		shortcuts.forEach(function (sc) {
			sc.addEventListener("mouseenter", function () {
				if (selected.length) return;
				var lab = sc.querySelector(".w95-label");
				setStatus((lab ? lab.textContent : "") + "  -  " + sc.getAttribute("href"));
			});
			sc.addEventListener("mouseleave", function () {
				if (selected.length) return;
				refreshStatus();
			});
			sc.addEventListener("click", function (e) {
				if (e.ctrlKey || e.metaKey) {
					e.preventDefault();
					toggleSelect(sc);
				}
			});
		});

		body.addEventListener("mousedown", function (e) {
			if (!e.target.closest(".w95-shortcut")) clearSelection();
		});

		desktop.addEventListener("mousedown", function (e) {
			if (e.target === desktop) clearSelection();
		});

		/* --- window open / minimize / close / maximize --- */
		function openWindow() {
			win.hidden = false;
			taskbar.hidden = true;
			var first = win.querySelector(".w95-btn");
			if (first) first.focus();
		}

		function minimizeWindow() {
			hideAbout();
			closeMenus();
			win.hidden = true;
			taskbar.hidden = false;
			taskbtn.focus();
		}

		function closeWindow() {
			hideAbout();
			closeMenus();
			win.hidden = true;
			taskbar.hidden = true;
			launcher.focus();
		}

		function toggleMaximize() {
			maximized = !maximized;
			if (maximized) {
				win.classList.add("is-maximized");
				win.style.transform = "";
				maxBtn.innerHTML = "&#9647;";
				maxBtn.setAttribute("aria-label", "Restore");
			} else {
				win.classList.remove("is-maximized");
				win.style.transform = "translate(" + pos.x + "px," + pos.y + "px)";
				maxBtn.innerHTML = "&#9633;";
				maxBtn.setAttribute("aria-label", "Maximize");
			}
		}

		win.querySelectorAll("[data-win-action]").forEach(function (btn) {
			btn.addEventListener("click", function (e) {
				e.stopPropagation();
				var action = btn.dataset.winAction;
				if (action === "min") minimizeWindow();
				else if (action === "close") closeWindow();
				else if (action === "max") toggleMaximize();
			});
		});

		/* --- titlebar drag --- */
		titlebar.addEventListener("pointerdown", function (e) {
			if (e.button !== 0) return;
			if (e.target.closest(".w95-controls")) return;
			if (maximized) return;
			if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 700) return;
			drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, z: zoomFactor() };
			win.classList.add("is-dragging");
			titlebar.setPointerCapture(e.pointerId);
		});

		titlebar.addEventListener("pointermove", function (e) {
			if (!drag || e.pointerId !== drag.id) return;
			var maxX = desktop.offsetWidth - win.offsetWidth - 8;
			var maxY = desktop.offsetHeight - win.offsetHeight - 8;
			if (maxX < 0) maxX = 0;
			if (maxY < 0) maxY = 0;
			var nx = drag.ox + (e.clientX - drag.sx) / drag.z;
			var ny = drag.oy + (e.clientY - drag.sy) / drag.z;
			pos.x = Math.min(Math.max(nx, -8), maxX);
			pos.y = Math.min(Math.max(ny, -8), maxY);
			win.style.transform = "translate(" + pos.x + "px," + pos.y + "px)";
		});

		function endDrag(e) {
			if (!drag) return;
			if (e && e.pointerId !== drag.id) return;
			drag = null;
			win.classList.remove("is-dragging");
		}

		titlebar.addEventListener("pointerup", endDrag);
		titlebar.addEventListener("pointercancel", endDrag);

		/* --- menubar dropdowns --- */
		var menus = Array.prototype.slice.call(menubar.querySelectorAll(".w95-menu"));

		function closeMenus() {
			menus.forEach(function (m) {
				m.classList.remove("is-open");
				m.querySelector(".w95-dropdown").hidden = true;
				m.querySelector(".w95-menubtn").setAttribute("aria-expanded", "false");
			});
		}

		menus.forEach(function (m) {
			var btn = m.querySelector(".w95-menubtn");
			var dd = m.querySelector(".w95-dropdown");
			btn.addEventListener("click", function (e) {
				e.stopPropagation();
				var wasOpen = m.classList.contains("is-open");
				closeMenus();
				if (!wasOpen) {
					m.classList.add("is-open");
					dd.hidden = false;
					btn.setAttribute("aria-expanded", "true");
				}
			});
			btn.addEventListener("keydown", function (e) {
				if (e.key === "ArrowDown") {
					e.preventDefault();
					btn.click();
					var first = dd.querySelector(".w95-menuitem");
					if (first) first.focus();
				}
			});
		});

		/* --- about dialog --- */
		function showAbout() {
			hideAbout();
			about.hidden = false;
			aboutOk.focus();
		}

		function hideAbout() {
			about.hidden = true;
		}

		aboutOk.addEventListener("click", hideAbout);
		aboutX.addEventListener("click", hideAbout);

		/* --- visual feedback --- */
		function flash() {
			win.classList.add("is-arranging");
			setTimeout(function () {
				win.classList.remove("is-arranging");
			}, 300);
		}

		function arrangeIcons() {
			shortcuts.forEach(function (sc) {
				body.appendChild(sc);
			});
			flash();
		}

		/* --- menu actions --- */
		var actions = {
			refresh: flash,
			close: closeWindow,
			"select-all": function () {
				selected = shortcuts.slice();
				applySelection();
			},
			clear: clearSelection,
			statusbar: function () {
				statusOnHover = !statusOnHover;
				statusbar.hidden = !statusOnHover;
				menubar.querySelector('[data-action="statusbar"]').classList.toggle("is-checked", statusOnHover);
				if (statusOnHover) refreshStatus();
			},
			arrange: arrangeIcons,
			about: showAbout
		};

		menubar.querySelectorAll(".w95-menuitem").forEach(function (item) {
			item.addEventListener("click", function (e) {
				e.stopPropagation();
				var fn = actions[item.dataset.action];
				closeMenus();
				if (fn) fn();
			});
		});

		/* --- desktop launcher + taskbar --- */
		launcher.addEventListener("click", function (e) {
			e.preventDefault();
			openWindow();
		});
		taskbtn.addEventListener("click", openWindow);

		/* --- context menu --- */
		function closeCtx() {
			ctxMenu.hidden = true;
			ctxMenu.textContent = "";
		}

		function buildCtx(items, x, y) {
			ctxMenu.textContent = "";
			items.forEach(function (it) {
				if (it.sep) {
					var sep = document.createElement("div");
					sep.className = "w95-menusep";
					ctxMenu.appendChild(sep);
					return;
				}
				var b = document.createElement("button");
				b.type = "button";
				b.className = "w95-menuitem" + (it.disabled ? " is-disabled" : "");
				b.setAttribute("role", "menuitem");
				b.textContent = it.label;
				if (it.disabled) {
					b.disabled = true;
				} else {
					b.addEventListener("click", function (e) {
						e.stopPropagation();
						closeCtx();
						it.run();
					});
				}
				ctxMenu.appendChild(b);
			});
			ctxMenu.hidden = false;
			var maxX = desktop.offsetWidth - ctxMenu.offsetWidth - 2;
			var maxY = desktop.offsetHeight - ctxMenu.offsetHeight - 2;
			if (x > maxX) x = maxX;
			if (y > maxY) y = maxY;
			if (x < 0) x = 0;
			if (y < 0) y = 0;
			ctxMenu.style.left = x + "px";
			ctxMenu.style.top = y + "px";
			var first = ctxMenu.querySelector(".w95-menuitem:not(:disabled)");
			if (first) first.focus();
		}

		desktop.addEventListener("contextmenu", function (e) {
			if (pane.hidden) return;
			e.preventDefault();
			closeMenus();
			hideAbout();
			var z = zoomFactor();
			var rect = desktop.getBoundingClientRect();
			var x = (e.clientX - rect.left) / z;
			var y = (e.clientY - rect.top) / z;
			var sc = e.target.closest(".w95-shortcut");
			if (sc && win.contains(sc)) {
				if (selected.indexOf(sc) === -1) selectOnly(sc);
				buildCtx(
					[
						{
							label: "Open",
							run: function () {
								window.open(sc.getAttribute("href"), "_blank", "noopener");
							}
						},
						{ label: "Select", run: function () { toggleSelect(sc); } },
						{ sep: true },
						{ label: "Properties", run: showAbout }
					],
					x,
					y
				);
			} else {
				buildCtx(
					[
						{ label: "Arrange Icons", run: arrangeIcons },
						{ label: "Refresh", run: flash },
						{ sep: true },
						{ label: "Paste", disabled: true },
						{ label: "Properties", run: showAbout }
					],
					x,
					y
				);
			}
		});

		/* --- dismiss helpers --- */
		document.addEventListener("click", function (e) {
			if (!menubar.contains(e.target)) closeMenus();
			if (!ctxMenu.hidden && !ctxMenu.contains(e.target)) closeCtx();
		});

		document.addEventListener("keydown", function (e) {
			if (e.key !== "Escape") return;
			if (!about.hidden) {
				hideAbout();
				return;
			}
			if (!ctxMenu.hidden) {
				closeCtx();
				return;
			}
			closeMenus();
		});
	}
	initWin95();

	/* ---------- news ticker ---------- */
	var RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";
	var FEEDS = [
		"https://www.pcgamer.com/rss/",
		"https://www.rockpapershotgun.com/feed"
	];
	var FALLBACK_API = "https://hn.algolia.com/api/v1/search?tags=story&query=gaming&hitsPerPage=10";
	var REFRESH_MS = 10 * 60 * 1000;

	function fetchJson(url, ms) {
		ms = ms || 8000;
		if (typeof AbortController === "undefined") {
			return fetch(url).then(function (r) {
				if (!r.ok) throw new Error("HTTP " + r.status);
				return r.json();
			});
		}
		var ctrl = new AbortController();
		var timer = setTimeout(function () {
			ctrl.abort();
		}, ms);
		return fetch(url, { signal: ctrl.signal }).then(function (r) {
			if (!r.ok) throw new Error("HTTP " + r.status);
			return r.json();
		}).finally(function () {
			clearTimeout(timer);
		});
	}

	function loadNews() {
		var track = document.getElementById("tickertrack");
		if (!track) return;

		Promise.allSettled(
			FEEDS.map(function (feed) {
				return fetchJson(RSS2JSON + encodeURIComponent(feed));
			})
		).then(function (results) {
			var items = [];
			results.forEach(function (r) {
				if (r.status !== "fulfilled" || !r.value || r.value.status !== "ok") return;
				(r.value.items || []).forEach(function (it) {
					if (it.title && it.link) {
						items.push({ title: it.title, url: it.link, date: it.pubDate || "" });
					}
				});
			});

			if (items.length) {
				items.sort(function (a, b) {
					return b.date.localeCompare(a.date);
				});
				renderTicker(track, items.slice(0, 12));
				return;
			}

			fetchJson(FALLBACK_API)
				.then(function (data) {
					var hits = (data.hits || []).filter(function (h) {
						return h.title;
					}).map(function (h) {
						return {
							title: h.title,
							url: h.url || "https://news.ycombinator.com/item?id=" + h.objectID
						};
					});
					renderTicker(track, hits);
				})
				.catch(function () {
					renderTicker(track, []);
				});
		});
	}

	function renderTicker(track, items) {
		track.textContent = "";

		if (!items.length) {
			track.textContent = "FEED OFFLINE - CHECK BACK LATER";
			return;
		}

		for (var copy = 0; copy < 2; copy++) {
			var set = document.createElement("span");
			set.className = "tickerset";
			if (copy === 1) set.setAttribute("aria-hidden", "true");

			items.forEach(function (item) {
				var link = document.createElement("a");
				link.className = "mlink";
				link.href = item.url;
				link.target = "_blank";
				link.rel = "noopener noreferrer";
				link.textContent = item.title;
				set.appendChild(link);

				var sep = document.createElement("span");
				sep.className = "tsep";
				sep.textContent = "///";
				sep.setAttribute("aria-hidden", "true");
				set.appendChild(sep);
			});

			track.appendChild(set);
		}

		var width = track.scrollWidth;
		var seconds = Math.max(25, Math.round(width / 2 / 55));
		track.style.setProperty("--dur", seconds + "s");
	}

	loadNews();
	setInterval(loadNews, REFRESH_MS);
})();
