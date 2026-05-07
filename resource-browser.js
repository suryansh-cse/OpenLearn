(function() {
  function isExternalLink(url) {
    return /^https?:\/\//i.test(url || "");
  }

  function createTag(tag, extraClass) {
    const span = document.createElement("span");
    span.className = `tag-chip ${extraClass || ""}`.trim();
    span.textContent = tag;
    return span;
  }

  function createLink(href, text, className, openInNewTab) {
    const link = document.createElement("a");
    link.className = className;
    link.href = href;
    link.textContent = text;
    if (openInNewTab) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    return link;
  }

  function createCard(item) {
    const openInNewTab = isExternalLink(item.link);
    const card = document.createElement("article");
    card.className = "resource-card";

    const main = document.createElement("div");
    main.className = "resource-main";

    const heading = document.createElement("h3");
    const titleLink = createLink(item.link, item.title, "", openInNewTab);
    heading.appendChild(titleLink);

    const description = document.createElement("p");
    description.className = "muted";
    description.textContent = item.description;

    const tagRow = document.createElement("div");
    tagRow.className = "tag-row-small";
    (item.tags || []).forEach((tag) => {
      tagRow.appendChild(createTag(tag, "small"));
    });

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${item.lessons} lessons - ${item.level}`;

    main.appendChild(heading);
    main.appendChild(description);
    main.appendChild(tagRow);
    main.appendChild(meta);

    const action = document.createElement("div");
    action.className = "resource-action";
    action.appendChild(createLink(item.link, "Open", "btn-outline", openInNewTab));

    card.appendChild(main);
    card.appendChild(action);
    return card;
  }

  async function loadResources(config) {
    const response = await fetch(config.dataFile);
    if (!response.ok) {
      throw new Error("Failed to load resources.");
    }
    return response.json();
  }

  function initResourceBrowser() {
    const config = window.OpenLearnResourceConfig;
    if (!config || window.__openLearnResourceBrowserInitialized) {
      return;
    }

    window.__openLearnResourceBrowserInitialized = true;

    const container = document.getElementById("resourcesList");
    const tagRow = document.getElementById("tagRow");
    const searchInput = document.getElementById("resSearch");
    const levelFilter = document.getElementById("levelFilter");
    const clearButton = document.getElementById("clearFilters");
    const activeTags = new Set();

    function renderResources(list) {
      if (!container) {
        return;
      }

      container.innerHTML = "";
      if (!list.length) {
        const empty = document.createElement("p");
        empty.textContent = config.emptyMessage;
        container.appendChild(empty);
        return;
      }

      const grid = document.createElement("div");
      grid.className = "course-grid resources-grid";
      list.forEach((item) => grid.appendChild(createCard(item)));
      container.appendChild(grid);
    }

    function renderTagRow(data) {
      if (!tagRow) {
        return;
      }

      const counts = {};
      data.forEach((item) => {
        (item.tags || []).forEach((tag) => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });

      tagRow.innerHTML = "";
      Object.keys(counts).sort().forEach((tag) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tag-chip";
        button.dataset.tag = tag;
        button.textContent = `${tag} (${counts[tag]})`;
        button.addEventListener("click", () => {
          if (activeTags.has(tag)) {
            activeTags.delete(tag);
            button.classList.remove("active");
          } else {
            activeTags.add(tag);
            button.classList.add("active");
          }
          applyFilters();
        });
        tagRow.appendChild(button);
      });
    }

    function applyFilters() {
      const query = (searchInput && searchInput.value || "").toLowerCase().trim();
      const level = (levelFilter && levelFilter.value || "").toLowerCase();
      const resources = window.__openLearnResources || [];
      const selectedTags = Array.from(activeTags);

      const filtered = resources.filter((resource) => {
        const matchesQuery =
          !query ||
          `${resource.title} ${resource.description} ${(resource.tags || []).join(" ")}`.toLowerCase().includes(query);
        const matchesLevel = !level || String(resource.level || "").toLowerCase() === level;
        const matchesTags = !selectedTags.length || (resource.tags || []).some((tag) => selectedTags.includes(tag));
        return matchesQuery && matchesLevel && matchesTags;
      });

      renderResources(filtered);
    }

    loadResources(config)
      .then((data) => {
        window.__openLearnResources = Array.isArray(data) ? data : [];
        renderTagRow(window.__openLearnResources);
        renderResources(window.__openLearnResources);
      })
      .catch((error) => {
        if (container) {
          container.textContent = config.errorMessage || "Failed to load resources. Please refresh the page.";
        }
        console.error(error);
      });

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }
    if (levelFilter) {
      levelFilter.addEventListener("change", applyFilters);
    }
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = "";
        }
        if (levelFilter) {
          levelFilter.value = "";
        }
        activeTags.clear();
        document.querySelectorAll("#tagRow .tag-chip.active").forEach((node) => node.classList.remove("active"));
        applyFilters();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResourceBrowser);
  } else {
    initResourceBrowser();
  }
})();
