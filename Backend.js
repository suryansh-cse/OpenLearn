(function () {
  function getSearchItems() {
    if (Array.isArray(window.searchData) && window.searchData.length > 0) {
      return window.searchData;
    }

    if (Array.isArray(window.courses) && window.courses.length > 0) {
      return window.courses.map((course) => ({
        title: course.title,
        type: "course",
        page: course.page,
        keywords: course.keywords || [course.title.toLowerCase()]
      }));
    }

    return [];
  }

  function matchesQuery(item, query) {
    const haystack = [
      item.title || "",
      ...(item.keywords || []),
      item.type || ""
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  }

  function renderSuggestions(items, suggestionsBox) {
    suggestionsBox.innerHTML = "";

    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "suggestion-item";
      empty.textContent = "No matching pages found.";
      suggestionsBox.appendChild(empty);
      suggestionsBox.style.display = "block";
      return;
    }

    items.slice(0, 8).forEach((item) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = item.title;
      div.addEventListener("click", () => {
        window.location.href = item.page;
      });
      suggestionsBox.appendChild(div);
    });

    suggestionsBox.style.display = "block";
  }

  function initSearch() {
    if (window.__openLearnSearchInitialized) {
      return;
    }

    const searchInput = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("suggestions");

    if (!searchInput || !suggestionsBox) {
      return;
    }

    window.__openLearnSearchInitialized = true;

    const searchItems = getSearchItems();

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase().trim();

      if (!query) {
        suggestionsBox.innerHTML = "";
        suggestionsBox.style.display = "none";
        return;
      }

      const matches = searchItems.filter((item) => matchesQuery(item, query));
      renderSuggestions(matches, suggestionsBox);
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      const query = searchInput.value.toLowerCase().trim();
      if (!query) {
        return;
      }

      const match = searchItems.find((item) => matchesQuery(item, query));
      if (match) {
        window.location.href = match.page;
        return;
      }

      renderSuggestions([], suggestionsBox);
    });

    document.addEventListener("click", (event) => {
      if (!suggestionsBox.contains(event.target) && event.target !== searchInput) {
        suggestionsBox.style.display = "none";
      }
    });
  }

  window.initOpenLearnSearch = initSearch;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearch);
  } else {
    initSearch();
  }
})();
