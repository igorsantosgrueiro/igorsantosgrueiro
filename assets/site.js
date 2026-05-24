(function () {
  "use strict";

  var STORAGE_KEY = "santosgrueiro-theme";
  var root = document.documentElement;
  var themeToggle = document.querySelector("[data-theme-toggle]");
  var siteNav = document.querySelector("[data-nav]");
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var ACTION_LABELS = {
    pdf: { text: "pdf", label: "paper" },
    slides: { text: "slides", label: "slides" },
    talk: { text: "talk", label: "talk" },
    code: { text: "code", label: "code" },
    data: { text: "data", label: "data" },
    doi: { text: "doi", label: "doi" },
    url: { text: "url", label: "url" }
  };

  function preferredTheme() {
    var saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
    if (themeToggle) {
      themeToggle.checked = theme === "light";
    }
  }

  setTheme(preferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener("change", function () {
      setTheme(themeToggle.checked ? "light" : "dark");
    });
  }

  if (siteNav && menuToggle) {
    siteNav.setAttribute("data-menu-ready", "true");
    setMenuOpen(false);

    menuToggle.addEventListener("click", function () {
      setMenuOpen(siteNav.getAttribute("data-menu-open") !== "true");
    });

    siteNav.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });

    Array.prototype.forEach.call(siteNav.querySelectorAll("a"), function (link) {
      link.addEventListener("click", function () {
        setMenuOpen(false);
      });
    });
  }

  if (document.querySelector("[data-publications]")) {
    loadPublications();
  }

  function setMenuOpen(open) {
    if (!siteNav || !menuToggle) {
      return;
    }

    siteNav.setAttribute("data-menu-open", open ? "true" : "false");
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function loadPublications() {
    var status = document.getElementById("publication-status");
    var list = document.getElementById("publication-list");
    var searchInput = document.getElementById("publication-search");
    var yearFilter = document.getElementById("year-filter");
    var typeFilter = document.getElementById("type-filter");
    var form = document.getElementById("publication-filters");

    fetch("publications.bib", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }
        return response.text();
      })
      .then(function (bibtex) {
        var publications = parseBibTex(bibtex)
          .map(normalizePublication)
          .filter(function (paper) {
            return paper.title;
          })
          .sort(sortPublications);

        populateFilters(publications, yearFilter, typeFilter);
        renderPublications(publications, status, list);

        form.addEventListener("input", function () {
          renderPublications(publications, status, list);
        });

        form.addEventListener("reset", function () {
          window.setTimeout(function () {
            renderPublications(publications, status, list);
          });
        });
      })
      .catch(function (error) {
        status.textContent = "error loading publications.bib";
        list.innerHTML = "";
        var message = document.createElement("p");
        message.className = "error-state";
        message.textContent = "Could not load publications.bib (" + error.message + "). Serve the folder with a local web server.";
        list.appendChild(message);
      });

    function renderPublications(publications, statusNode, listNode) {
      var query = normalizeText(searchInput.value);
      var selectedYear = yearFilter.value || "all";
      var selectedType = typeFilter.value || "all";
      var filtered = publications.filter(function (paper) {
        var matchesQuery = !query || paper.searchText.indexOf(query) !== -1;
        var matchesYear = selectedYear === "all" || paper.year === selectedYear;
        var matchesType = selectedType === "all" || paper.type === selectedType;
        return matchesQuery && matchesYear && matchesType;
      });

      statusNode.textContent = filtered.length + " / " + publications.length + " publications";
      listNode.innerHTML = "";

      if (!filtered.length) {
        var empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No publications match the current filter.";
        listNode.appendChild(empty);
        return;
      }

      var fragment = document.createDocumentFragment();
      var previousYear = "";

      filtered.forEach(function (paper) {
        if (paper.year !== previousYear) {
          var heading = document.createElement("h2");
          heading.className = "year-heading";
          heading.textContent = paper.year || "n.d.";
          fragment.appendChild(heading);
          previousYear = paper.year;
        }

        fragment.appendChild(renderPublication(paper));
      });

      listNode.appendChild(fragment);
    }
  }

  function populateFilters(publications, yearFilter, typeFilter) {
    var years = unique(publications.map(function (paper) { return paper.year; })).filter(Boolean);
    var types = unique(publications.map(function (paper) { return paper.type; })).filter(Boolean);

    fillSelect(yearFilter, ["all"].concat(years), function (value) {
      return value === "all" ? "all years" : value;
    });

    fillSelect(typeFilter, ["all"].concat(types), function (value) {
      return value === "all" ? "all types" : value;
    });
  }

  function fillSelect(select, values, labelFor) {
    select.innerHTML = "";
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = labelFor(value);
      select.appendChild(option);
    });
  }

  function renderPublication(paper) {
    var item = document.createElement("article");
    item.className = "publication-item";

    var citation = document.createElement("p");
    citation.className = "publication-citation";

    if (paper.authors) {
      var authors = document.createElement("span");
      authors.className = "publication-authors";
      authors.textContent = paper.authors;
      citation.appendChild(authors);
      citation.appendChild(document.createTextNode(". "));
    }

    if (paper.year) {
      citation.appendChild(document.createTextNode("(" + paper.year + "). "));
    }

    var title = document.createElement("span");
    title.className = "publication-title";
    title.textContent = paper.title;
    citation.appendChild(title);
    citation.appendChild(document.createTextNode("."));

    if (paper.venue) {
      citation.appendChild(document.createTextNode(" "));
      var venue = document.createElement("span");
      venue.className = "publication-venue";
      venue.textContent = paper.venue;
      citation.appendChild(venue);
      citation.appendChild(document.createTextNode("."));
    }

    item.appendChild(citation);

    if (paper.media.length) {
      item.appendChild(renderMedia(paper.media));
    }

    var actions = document.createElement("div");
    actions.className = "publication-actions";
    addActionLink(actions, "pdf", paper.fields.pdf);
    addActionLink(actions, "slides", paper.fields.slides);
    addActionLink(actions, "talk", paper.fields.talk);
    addActionLink(actions, "code", paper.fields.code);
    addActionLink(actions, "data", paper.fields.data);
    addActionLink(actions, "doi", paper.fields.doi ? "https://doi.org/" + paper.fields.doi : "");
    addActionLink(actions, "url", paper.fields.url);

    var details = document.createElement("details");
    var summary = document.createElement("summary");
    summary.className = "publication-action";
    summary.textContent = "bib";
    summary.title = "bibtex";
    summary.setAttribute("aria-label", "bibtex");
    var pre = document.createElement("pre");
    pre.textContent = paper.raw;
    details.appendChild(summary);
    details.appendChild(pre);
    actions.appendChild(details);
    item.appendChild(actions);

    return item;
  }

  function addActionLink(parent, label, href) {
    if (!href) {
      return;
    }
    var action = ACTION_LABELS[label] || { text: label, label: label };
    var link = document.createElement("a");
    link.className = "publication-action";
    link.href = href;
    link.textContent = action.text;
    link.title = action.label;
    link.setAttribute("aria-label", action.label);
    link.target = "_blank";
    link.rel = "noopener";
    parent.appendChild(link);
  }

  function addLink(parent, label, href) {
    if (!href) {
      return;
    }
    var link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    link.target = "_blank";
    link.rel = "noopener";
    parent.appendChild(link);
  }

  function renderMedia(items) {
    var media = document.createElement("div");
    media.className = "publication-media";
    media.appendChild(textSpan("media:"));

    items.forEach(function (item) {
      addLink(media, item.label, item.url);
    });

    return media;
  }

  function textSpan(text) {
    var span = document.createElement("span");
    span.textContent = text;
    return span;
  }

  function parseBibTex(input) {
    var entries = [];
    var index = 0;
    var text = input.replace(/^\uFEFF/, "");

    while (index < text.length) {
      var at = text.indexOf("@", index);
      if (at === -1) {
        break;
      }

      var open = text.indexOf("{", at);
      if (open === -1) {
        break;
      }

      var type = text.slice(at + 1, open).trim().toLowerCase();
      var close = findMatchingBrace(text, open);
      if (close === -1) {
        break;
      }

      var content = text.slice(open + 1, close);
      var raw = text.slice(at, close + 1).trim();
      var parsed = parseEntry(type, content);
      parsed.raw = raw;
      entries.push(parsed);
      index = close + 1;
    }

    return entries;
  }

  function parseEntry(type, content) {
    var comma = findTopLevelComma(content);
    var key = comma === -1 ? "" : content.slice(0, comma).trim();
    var fieldsText = comma === -1 ? content : content.slice(comma + 1);
    var fields = {};
    var index = 0;

    while (index < fieldsText.length) {
      index = skipSeparators(fieldsText, index);
      var nameStart = index;
      while (/[A-Za-z0-9_-]/.test(fieldsText.charAt(index))) {
        index += 1;
      }

      var name = fieldsText.slice(nameStart, index).toLowerCase();
      if (!name) {
        index += 1;
        continue;
      }

      index = skipWhitespace(fieldsText, index);
      if (fieldsText.charAt(index) !== "=") {
        continue;
      }
      index += 1;
      index = skipWhitespace(fieldsText, index);

      var parsedValue = readValue(fieldsText, index);
      fields[name] = cleanBibValue(parsedValue.value);
      index = parsedValue.next;
    }

    return {
      type: type,
      key: key,
      fields: fields
    };
  }

  function readValue(text, index) {
    var char = text.charAt(index);

    if (char === "{") {
      var close = findMatchingBrace(text, index);
      return {
        value: close === -1 ? text.slice(index + 1) : text.slice(index + 1, close),
        next: close === -1 ? text.length : close + 1
      };
    }

    if (char === "\"") {
      var cursor = index + 1;
      while (cursor < text.length) {
        if (text.charAt(cursor) === "\"" && text.charAt(cursor - 1) !== "\\") {
          break;
        }
        cursor += 1;
      }
      return {
        value: text.slice(index + 1, cursor),
        next: cursor + 1
      };
    }

    var comma = text.indexOf(",", index);
    return {
      value: comma === -1 ? text.slice(index) : text.slice(index, comma),
      next: comma === -1 ? text.length : comma + 1
    };
  }

  function findMatchingBrace(text, openIndex) {
    var depth = 0;
    for (var i = openIndex; i < text.length; i += 1) {
      var char = text.charAt(i);
      if (char === "{" && text.charAt(i - 1) !== "\\") {
        depth += 1;
      } else if (char === "}" && text.charAt(i - 1) !== "\\") {
        depth -= 1;
        if (depth === 0) {
          return i;
        }
      }
    }
    return -1;
  }

  function findTopLevelComma(text) {
    var depth = 0;
    for (var i = 0; i < text.length; i += 1) {
      var char = text.charAt(i);
      if (char === "{" && text.charAt(i - 1) !== "\\") {
        depth += 1;
      } else if (char === "}" && text.charAt(i - 1) !== "\\") {
        depth -= 1;
      } else if (char === "," && depth === 0) {
        return i;
      }
    }
    return -1;
  }

  function skipSeparators(text, index) {
    while (/[\s,]/.test(text.charAt(index))) {
      index += 1;
    }
    return index;
  }

  function skipWhitespace(text, index) {
    while (/\s/.test(text.charAt(index))) {
      index += 1;
    }
    return index;
  }

  function normalizePublication(entry) {
    var fields = entry.fields;
    var title = fields.title || "";
    var authors = formatAuthors(fields.author || "");
    var year = fields.year || "";
    var type = readableType(entry.type);
    var venueText = formatVenue(fields, type);

    return {
      key: entry.key,
      type: type,
      year: year,
      title: title,
      authors: authors,
      venue: venueText,
      media: parseMedia(fields.media || ""),
      fields: fields,
      raw: entry.raw,
      searchText: normalizeText([title, authors, venueText, year, type, fields.keywords || "", fields.media || ""].join(" "))
    };
  }

  function cleanBibValue(value) {
    return decodeEntities(value)
      .replace(/\$?\^\{st\}\$?/gi, "st")
      .replace(/\$?\^\{nd\}\$?/gi, "nd")
      .replace(/\$?\^\{rd\}\$?/gi, "rd")
      .replace(/\$?\^\{th\}\$?/gi, "th")
      .replace(/\\&/g, "&")
      .replace(/\\_/g, "_")
      .replace(/\\%/g, "%")
      .replace(/\\[a-zA-Z]+\s*\{([^{}]*)\}/g, "$1")
      .replace(/\\['`^\"~=.uvHtcdbk]\s*\{?([A-Za-z])\}?/g, "$1")
      .replace(/[{}]/g, "")
      .replace(/--/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatVenue(fields, type) {
    var venue = fields.journal || fields.booktitle || fields.publisher || fields.school || "";
    var parts = [];

    if (venue) {
      if (type === "journal" && fields.volume) {
        venue += ", " + fields.volume + (fields.number ? "(" + fields.number + ")" : "");
      } else if (fields.volume && !/vol\\.?|volume/i.test(venue)) {
        parts.push("vol. " + fields.volume);
      }
      parts.unshift(venue);
    }

    if (fields.pages) {
      parts.push(formatPages(fields.pages));
    }

    return parts.join(", ");
  }

  function formatPages(value) {
    return "pp. " + value.replace(/--/g, "-");
  }

  function parseMedia(value) {
    if (!value) {
      return [];
    }

    return value.split(/\s*;\s*/).map(function (item) {
      var parts = item.split("::");
      if (parts.length < 2) {
        return null;
      }

      return {
        label: parts[0].trim(),
        url: parts.slice(1).join("::").trim()
      };
    }).filter(function (item) {
      return item && item.label && item.url;
    });
  }

  function decodeEntities(value) {
    var textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }

  function formatAuthors(value) {
    if (!value) {
      return "";
    }

    return value.split(/\s+and\s+/i).map(function (author) {
      var cleaned = author.trim();
      if (cleaned.indexOf(",") === -1) {
        return cleaned;
      }
      var parts = cleaned.split(",").map(function (part) { return part.trim(); });
      return [parts.slice(1).join(" "), parts[0]].filter(Boolean).join(" ");
    }).join("; ");
  }

  function readableType(type) {
    var map = {
      article: "journal",
      inproceedings: "conference",
      proceedings: "proceedings",
      incollection: "chapter",
      book: "book",
      phdthesis: "thesis",
      mastersthesis: "thesis",
      techreport: "report"
    };
    return map[type] || type || "entry";
  }

  function sortPublications(a, b) {
    var yearA = Number(a.year) || 0;
    var yearB = Number(b.year) || 0;
    if (yearA !== yearB) {
      return yearB - yearA;
    }
    return a.title.localeCompare(b.title);
  }

  function unique(values) {
    return values.filter(function (value, index) {
      return value && values.indexOf(value) === index;
    });
  }

  function normalizeText(value) {
    return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
}());
