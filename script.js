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

	/* ---------- win95 window controls ---------- */
	document.querySelectorAll("[data-win-action]").forEach(function (btn) {
		btn.addEventListener("click", function () {
			if (btn.dataset.winAction === "max") return;
			activate("main1");
		});
	});

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
