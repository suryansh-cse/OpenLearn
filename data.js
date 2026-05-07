window.courses = (window.searchData || [])
  .filter((item) => item.type === "course")
  .map((item) => ({
    title: item.title,
    slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    keywords: item.keywords || [item.title.toLowerCase()],
    page: item.page
  }));
