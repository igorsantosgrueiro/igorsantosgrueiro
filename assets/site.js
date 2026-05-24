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
      var adventureQuery = isAdventureQuery(query);
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
        empty.textContent = adventureQuery
          ? "No matching paper. A duel starts in the stacks."
          : "No publications match the current filter.";
        listNode.appendChild(empty);
        if (adventureQuery) {
          listNode.appendChild(renderAdventureEgg());
        }
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

  function renderAdventureEgg() {
    var duels = [
      {
        defensePrompt: "Your exploit chain has more holes than your threat model.",
        defenseReplies: [
          "My threat model was accepted with minor revisions.",
          "Only if you count the supplementary material.",
          "That is because I model the attacker, not the excuses."
        ],
        defenseAnswer: 2,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your patch notes read like ransomware demands.",
          "Your patch notes read like a changelog.",
          "Your patch notes read like an abstract."
        ],
        attackAnswer: 0,
        rivalReply: "I... object to the methodology."
      },
      {
        defensePrompt: "Your related work is so stale even DBLP sent a correction.",
        defenseReplies: [
          "Good. The threat model includes bibliographic drift.",
          "Then I will refresh it before the rebuttal tide comes in.",
          "At least my citations have a reproducible artifact."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your related work is a treasure map with no treasure.",
          "Your related work is many works related together.",
          "Your related work has a respectable page count."
        ],
        attackAnswer: 0,
        rivalReply: "I blame the proceedings metadata."
      },
      {
        defensePrompt: "You call that reverse engineering? The obfuscator left better notes.",
        defenseReplies: [
          "I only reverse forward-compatible binaries.",
          "The notes were rejected by artifact evaluation.",
          "Intent is for lawyers; traces are for me."
        ],
        defenseAnswer: 2,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your CFG has the structure of wet spaghetti.",
          "Your CFG has a very modern architecture.",
          "Your CFG has all the required sections."
        ],
        attackAnswer: 0,
        rivalReply: "At least my basic blocks have manners."
      },
      {
        defensePrompt: "Your fuzzer could not crash a tavern door.",
        defenseReplies: [
          "It only crashes things with measurable coverage.",
          "The door was out of scope for artifact evaluation.",
          "I saved that crash for the camera-ready."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your seed corpus has the entropy of a treasure map drawn in crayon.",
          "Your seed corpus is carefully curated.",
          "Your seed corpus contains many representative doors."
        ],
        attackAnswer: 0,
        rivalReply: "My minimizer will hear about this."
      },
      {
        defensePrompt: "Your sandbox leaks more secrets than a pirate with a podcast.",
        defenseReplies: [
          "Only to attackers who already control the parrot.",
          "That is why I brought a syscall policy and a mop.",
          "The leak is feature-gated behind reviewer two."
        ],
        defenseAnswer: 1,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your isolation boundary is painted on the floor.",
          "Your isolation boundary has excellent documentation.",
          "Your isolation boundary is very boundaries."
        ],
        attackAnswer: 0,
        rivalReply: "I was told the chalk was production-grade."
      },
      {
        defensePrompt: "Your web tracker is so obvious even the cookie banner blocked it.",
        defenseReplies: [
          "Good. Consent should have a threat model too.",
          "I track only anonymous sea routes.",
          "The banner accepted after major revisions."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your privacy policy has more redirects than your code.",
          "Your privacy policy is concise and readable.",
          "Your privacy policy mentions cookies."
        ],
        attackAnswer: 0,
        rivalReply: "Those redirects are for user experience."
      },
      {
        defensePrompt: "Your static analysis found dead code and joined its crew.",
        defenseReplies: [
          "Then it finally learned reachability.",
          "Dead code is where I keep the reviewers.",
          "It only joined to collect better traces."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your taint analysis spreads faster than a tavern rumor.",
          "Your taint analysis is sound and complete.",
          "Your taint analysis has nice colors."
        ],
        attackAnswer: 0,
        rivalReply: "At least the rumor has a proof sketch."
      },
      {
        defensePrompt: "Your exploit mitigation is a paper hat in a hurricane.",
        defenseReplies: [
          "And yet it still raises the attack cost.",
          "It is a formally verified paper hat.",
          "The hurricane was excluded from the benchmark."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your ROP chain trips over its own gadgets.",
          "Your ROP chain has clear modularity.",
          "Your ROP chain uses reusable components."
        ],
        attackAnswer: 0,
        rivalReply: "I call that control-flow agility."
      },
      {
        defensePrompt: "Your benchmark is so biased it asked for tenure.",
        defenseReplies: [
          "Then I will stratify it before it joins a committee.",
          "Bias is just variance with confidence.",
          "It only votes in artifact evaluation."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your baseline is a scarecrow with a GitHub badge.",
          "Your baseline is very competitive.",
          "Your baseline has a neat README."
        ],
        attackAnswer: 0,
        rivalReply: "That scarecrow has citations."
      },
      {
        defensePrompt: "Your browser extension has more permissions than a pirate king.",
        defenseReplies: [
          "And I revoke them one manifest at a time.",
          "The crown requires host access.",
          "That is just least privilege with confidence."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your manifest requests all_urls because subtlety timed out.",
          "Your manifest is carefully scoped.",
          "Your manifest has a nice icon."
        ],
        attackAnswer: 0,
        rivalReply: "It was for compatibility with every island."
      },
      {
        defensePrompt: "Your proof of concept needs a full moon and administrator rights.",
        defenseReplies: [
          "Still fewer assumptions than your defense.",
          "The moon is included in the Dockerfile.",
          "Administrator rights improve reproducibility."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your exploit reliability graph is mostly decorative rope.",
          "Your exploit reliability graph is readable.",
          "Your exploit reliability graph has error bars."
        ],
        attackAnswer: 0,
        rivalReply: "The rope passed peer review."
      },
      {
        defensePrompt: "Your dataset is smaller than my grog tab.",
        defenseReplies: [
          "Small, labelled, and less noisy than your tavern.",
          "The grog tab was not publicly available.",
          "I report median grog and interquartile rum."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your train/test split looks like it was done with a cutlass.",
          "Your train/test split is statistically sound.",
          "Your train/test split includes validation."
        ],
        attackAnswer: 0,
        rivalReply: "A cutlass is deterministic enough."
      },
      {
        defensePrompt: "Your logs are so noisy the signal filed a complaint.",
        defenseReplies: [
          "Good. Complaints are structured telemetry.",
          "The signal should have used syslog.",
          "Noise improves generalization."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your alert pipeline wakes up only for false positives.",
          "Your alert pipeline is highly available.",
          "Your alert pipeline has dashboards."
        ],
        attackAnswer: 0,
        rivalReply: "False positives need attention too."
      },
      {
        defensePrompt: "Your patch fixes the symptom and leaves the ghost ship sailing.",
        defenseReplies: [
          "Then I will sink the root cause in the next diff.",
          "The ghost ship is legacy support.",
          "Symptoms have feelings too."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your regression test is just a TODO with confidence.",
          "Your regression test is concise.",
          "Your regression test describes expected behavior."
        ],
        attackAnswer: 0,
        rivalReply: "Confidence is all CI ever wanted."
      },
      {
        defensePrompt: "Your paper has more acronyms than actual contributions.",
        defenseReplies: [
          "I expand them only for worthy opponents.",
          "Acronyms improve compression ratio.",
          "The contributions are in Appendix Z."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your related work section is a treasure map with no treasure.",
          "Your related work section is comprehensive.",
          "Your related work section cites the classics."
        ],
        attackAnswer: 0,
        rivalReply: "The treasure was under double-blind review."
      },
      {
        defensePrompt: "Your malware classifier confuses a parrot with a payload.",
        defenseReplies: [
          "Only if the parrot imports Win32.",
          "The parrot had suspicious entropy.",
          "Payloads repeat less than parrots."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your feature vector has the personality of packed sand.",
          "Your feature vector is compact.",
          "Your feature vector has dimensionality."
        ],
        attackAnswer: 0,
        rivalReply: "Packed sand evades signature checks."
      },
      {
        defensePrompt: "Your symbolic executor got lost before the first branch.",
        defenseReplies: [
          "It was exploring the scenic path explosion.",
          "Branches are merely social constructs.",
          "The first branch lacked informed consent."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your path constraints are tied in sailor knots.",
          "Your path constraints are satisfiable.",
          "Your path constraints use clear variable names."
        ],
        attackAnswer: 0,
        rivalReply: "Those knots are SMT-friendly."
      },
      {
        defensePrompt: "Your CVE write-up reads like a treasure map without coordinates.",
        defenseReplies: [
          "The coordinates are in the proof of concept.",
          "Coordinates would break responsible disclosure.",
          "Treasure maps need narrative tension."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your severity score needs a compass and a conscience.",
          "Your severity score is industry standard.",
          "Your severity score has one decimal."
        ],
        attackAnswer: 0,
        rivalReply: "My compass points to critical."
      },
      {
        defensePrompt: "Your container image is mostly vulnerabilities in a trench coat.",
        defenseReplies: [
          "Then I will scan the coat and pin the CVEs.",
          "The coat keeps the dependencies warm.",
          "Layering is a legitimate fashion choice."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your supply chain has more hooks than a pirate convention.",
          "Your supply chain is traceable.",
          "Your supply chain uses semantic versioning."
        ],
        attackAnswer: 0,
        rivalReply: "Hooks improve extensibility."
      },
      {
        defensePrompt: "Your side channel is louder than the tavern band.",
        defenseReplies: [
          "Good. That makes the leakage easier to quantify.",
          "The band signed an NDA.",
          "Noise reduction is future work."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your timing measurements jitter like a cursed compass.",
          "Your timing measurements have confidence intervals.",
          "Your timing measurements use nanoseconds."
        ],
        attackAnswer: 0,
        rivalReply: "The compass was calibrated at sea."
      },
      {
        defensePrompt: "Your authentication flow trusts everyone with a hat.",
        defenseReplies: [
          "Then I will make the hat sign a challenge.",
          "Hats are strong second factors.",
          "The hat passed KYC."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your session token has the lifespan of a cursed relic.",
          "Your session token is persistent.",
          "Your session token is URL-safe."
        ],
        attackAnswer: 0,
        rivalReply: "Cursed relics are excellent for retention."
      },
      {
        defensePrompt: "Your code review approved the bug and requested changes from the fix.",
        defenseReplies: [
          "Then the review process is the vulnerability.",
          "The bug had better formatting.",
          "The fix forgot to update the changelog."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your pull request has more conflicts than a pirate council.",
          "Your pull request is ready for review.",
          "Your pull request has passing checks."
        ],
        attackAnswer: 0,
        rivalReply: "Consensus is hard at sea."
      },
      {
        defensePrompt: "Your password policy was designed by someone who hates users and entropy.",
        defenseReplies: [
          "Then I will replace it with a manager and rate limits.",
          "Users build character through rotation.",
          "Entropy is optional on Fridays."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your MFA prompt fatigue is a denial-of-sleep attack.",
          "Your MFA prompt is very visible.",
          "Your MFA prompt has helpful copy."
        ],
        attackAnswer: 0,
        rivalReply: "Sleep is not in the compliance checklist."
      },
      {
        defensePrompt: "Your memory safety story ends right before the pointer walks the plank.",
        defenseReplies: [
          "That is where the sanitizer starts singing.",
          "Pointers enjoy dramatic exits.",
          "The plank was bounds-checked."
        ],
        defenseAnswer: 0,
        attackPrompt: "Choose an opening insult.",
        attacks: [
          "Your heap metadata is guarded by a sleepy deckhand.",
          "Your heap metadata is compact.",
          "Your heap metadata has structure."
        ],
        attackAnswer: 0,
        rivalReply: "The deckhand is ASLR-aware."
      }
    ];
    var deck = shuffle(duels.slice());
    var starter = "player";
    var roundIndex = 0;
    var playerScore = 0;
    var rivalScore = 0;
    var targetScore = 3;
    var typeTimer = null;
    var advanceTimer = null;
    var usedInsults = {};
    var insultStorageKey = "isg-adventure-insults-v2";
    var comebackStorageKey = "isg-adventure-comebacks-v2";
    var startingInsults = [
      { text: "Your sandbox leaks more secrets than a pirate with a podcast.", weak: false },
      { text: "Your paper has more acronyms than actual contributions.", weak: false },
      { text: "You are rubber and I am glue.", weak: true },
      { text: "Your paper is bad because it is bad.", weak: true },
      { text: "I know you are, but what am I?", weak: true }
    ];
    var startingComebacks = [
      "Then the review process is the vulnerability.",
      "I expand them only for worthy opponents."
    ];
    var knownInsults = loadKnownInsults();
    var knownComebacks = loadKnownComebacks();

    var panel = document.createElement("div");
    panel.className = "adventure-egg";
    panel.style.setProperty("--player-step", "0");
    panel.style.setProperty("--rival-step", "0");
    panel.style.setProperty("--duel-offset", "0");

    var scoreboard = document.createElement("div");
    scoreboard.className = "adventure-score";
    panel.appendChild(scoreboard);

    var arena = document.createElement("div");
    arena.className = "adventure-arena";

    var player = renderPirateSprite("isg", "player");
    var rival = renderPirateSprite("reviewer", "rival");

    var referee = document.createElement("img");
    referee.className = "adventure-referee";
    referee.src = "assets/three-headed-monkey.gif";
    referee.alt = "Three-headed monkey";
    referee.loading = "lazy";

    var clash = document.createElement("div");
    clash.className = "adventure-clash";
    clash.setAttribute("aria-hidden", "true");

    arena.appendChild(player);
    arena.appendChild(referee);
    arena.appendChild(clash);
    arena.appendChild(rival);
    panel.appendChild(arena);

    var stage = document.createElement("div");
    stage.className = "adventure-stage";

    var dialogue = document.createElement("div");
    dialogue.className = "adventure-dialogue";
    var speaker = document.createElement("p");
    speaker.className = "adventure-speaker";
    var line = document.createElement("p");
    dialogue.appendChild(speaker);
    dialogue.appendChild(line);
    stage.appendChild(dialogue);
    panel.appendChild(stage);

    var replies = document.createElement("div");
    replies.className = "adventure-replies";
    panel.appendChild(replies);

    var result = document.createElement("p");
    result.className = "adventure-result";
    panel.appendChild(result);

    var retry = document.createElement("button");
    retry.className = "adventure-retry";
    retry.type = "button";
    retry.textContent = "retry";
    retry.hidden = true;
    retry.addEventListener("click", resetGame);
    panel.appendChild(retry);

    function clearDialogueTimers() {
      if (typeTimer) {
        window.clearTimeout(typeTimer);
        typeTimer = null;
      }

      if (advanceTimer) {
        window.clearTimeout(advanceTimer);
        advanceTimer = null;
      }

      panel.removeAttribute("data-speaking");
    }

    function syncScoreboard() {
      panel.style.setProperty("--player-step", String(playerScore));
      panel.style.setProperty("--rival-step", String(rivalScore));
      panel.style.setProperty("--duel-offset", String(playerScore - rivalScore));
      scoreboard.textContent = "isg " + playerScore + " : " + rivalScore + " reviewer | starts: " + speakerName(starter);
    }

    function speakerName(side) {
      return side === "player" ? "isg" : "reviewer";
    }

    function insultId(text) {
      return normalizeText(text).replace(/[^a-z0-9]+/g, " ").trim();
    }

    function markInsultUsed(text) {
      usedInsults[insultId(text)] = true;
    }

    function isInsultUsed(text) {
      return Boolean(usedInsults[insultId(text)]);
    }

    function nextFreshDuel() {
      var fallback = deck[roundIndex % deck.length];
      var offset;
      var candidate;

      for (offset = 0; offset < deck.length; offset += 1) {
        candidate = deck[(roundIndex + offset) % deck.length];

        if (!isInsultUsed(candidate.defensePrompt)) {
          roundIndex += offset;
          return candidate;
        }
      }

      return fallback;
    }

    function loadKnownInsults() {
      var byId = {};

      startingInsults.forEach(function (insult) {
        byId[insultId(insult.text)] = {
          text: insult.text,
          weak: Boolean(insult.weak)
        };
      });

      try {
        JSON.parse(window.sessionStorage.getItem(insultStorageKey) || "[]").forEach(function (insult) {
          if (insult && insult.text) {
            var id = insultId(insult.text);
            var existing = byId[id];
            byId[id] = {
              text: insult.text,
              weak: existing ? existing.weak && Boolean(insult.weak) : Boolean(insult.weak)
            };
          }
        });
      } catch (error) {
        // Session storage is optional; the duel still works without it.
      }

      return Object.keys(byId).map(function (id) {
        return byId[id];
      });
    }

    function saveKnownInsults() {
      try {
        window.sessionStorage.setItem(insultStorageKey, JSON.stringify(knownInsults));
      } catch (error) {
        // Ignore storage failures in private browsing or locked-down contexts.
      }
    }

    function loadKnownComebacks() {
      var byId = {};

      startingComebacks.forEach(function (text) {
        byId[insultId(text)] = text;
      });

      try {
        JSON.parse(window.sessionStorage.getItem(comebackStorageKey) || "[]").forEach(function (text) {
          if (text) {
            byId[insultId(text)] = text;
          }
        });
      } catch (error) {
        // Session storage is optional; the duel still works without it.
      }

      return Object.keys(byId).map(function (id) {
        return byId[id];
      });
    }

    function saveKnownComebacks() {
      try {
        window.sessionStorage.setItem(comebackStorageKey, JSON.stringify(knownComebacks));
      } catch (error) {
        // Ignore storage failures in private browsing or locked-down contexts.
      }
    }

    function learnInsult(text) {
      var id = insultId(text);
      var known = knownInsults.some(function (insult) {
        return insultId(insult.text) === id;
      });

      if (known) {
        return false;
      }

      knownInsults.push({
        text: text,
        weak: false
      });
      saveKnownInsults();
      return true;
    }

    function knowsComeback(text) {
      var id = insultId(text);
      return knownComebacks.some(function (comeback) {
        return insultId(comeback) === id;
      });
    }

    function learnComeback(text) {
      if (knowsComeback(text)) {
        return false;
      }

      knownComebacks.push(text);
      saveKnownComebacks();
      return true;
    }

    function findDuelByInsult(text) {
      var id = insultId(text);
      return duels.find(function (duel) {
        return insultId(duel.defensePrompt) === id;
      });
    }

    function usefulStartingInsultCount() {
      return startingInsults.filter(function (insult) {
        return !insult.weak;
      }).length;
    }

    function usefulKnownInsultCount() {
      return knownInsults.filter(function (insult) {
        return !insult.weak;
      }).length;
    }

    function reviewerHitChance() {
      var playedBonus = Math.min(roundIndex, 8) * 0.045;
      var insultBonus = Math.max(0, usefulKnownInsultCount() - usefulStartingInsultCount()) * 0.035;
      var comebackBonus = Math.max(0, knownComebacks.length - startingComebacks.length) * 0.045;

      return Math.min(0.82, 0.18 + playedBonus + insultBonus + comebackBonus);
    }

    function reviewerAnswersCorrectly() {
      return Math.random() < reviewerHitChance();
    }

    function awardPoint(winner) {
      if (winner === "player") {
        playerScore += 1;
        panel.setAttribute("data-last-hit", "player");
        starter = "player";
        return;
      }

      rivalScore += 1;
      panel.setAttribute("data-last-hit", "rival");
      starter = "reviewer";
    }

    function typeLine(nextSpeaker, text, callback) {
      var words = String(text).split(/\s+/).filter(Boolean);
      var index = 0;

      clearDialogueTimers();
      panel.setAttribute("data-speaking", "true");
      speaker.textContent = nextSpeaker;
      line.textContent = "";

      function tick() {
        line.textContent = words.slice(0, index + 1).join(" ");
        index += 1;

        if (index < words.length) {
          typeTimer = window.setTimeout(tick, 95);
          return;
        }

        typeTimer = null;
        panel.removeAttribute("data-speaking");

        if (callback) {
          advanceTimer = window.setTimeout(callback, Math.max(900, Math.min(1700, words.length * 75)));
        }
      }

      if (words.length) {
        tick();
      } else if (callback) {
        panel.removeAttribute("data-speaking");
        callback();
      }
    }

    function playExchange(lines, pointText, winner, callback) {
      var lineIndex = 0;
      replies.innerHTML = "";
      replies.removeAttribute("data-kind");
      result.textContent = "";

      function nextLine() {
        if (lineIndex >= lines.length) {
          awardPoint(winner);
          syncScoreboard();
          result.textContent = pointText;
          advanceTimer = window.setTimeout(callback, 1600);
          return;
        }

        var item = lines[lineIndex];
        lineIndex += 1;
        typeLine(item.speaker, item.text, nextLine);
      }

      nextLine();
    }

    function drawRound() {
      clearDialogueTimers();
      panel.removeAttribute("data-last-hit");
      panel.setAttribute("data-state", "playing");
      syncScoreboard();

      if (playerScore >= targetScore || rivalScore >= targetScore) {
        finishGame();
        return;
      }

      var playerStarts = starter === "player";
      var round = playerStarts ? null : nextFreshDuel();
      var answer = playerStarts ? -1 : round.defenseAnswer;
      var goodComeback = playerStarts ? "" : round.defenseReplies[answer];
      var learnedNewInsult = !playerStarts && learnInsult(round.defensePrompt);
      var knowsGoodComeback = !playerStarts && knowsComeback(goodComeback);
      var prompt = playerStarts ? "Choose an opening insult from memory." : round.defensePrompt;
      var promptSpeaker = playerStarts ? "isg" : "reviewer";
      speaker.textContent = promptSpeaker;
      line.textContent = "";
      result.textContent = "";
      replies.innerHTML = "";
      replies.removeAttribute("data-kind");

      typeLine(promptSpeaker, prompt, renderChoices);

      function renderChoices() {
        if (learnedNewInsult) {
          result.textContent = "new insult learned";
        }
        replies.setAttribute("data-kind", playerStarts ? "insults" : "comebacks");

        var choices = playerStarts
          ? orderKnownInsults()
          : shuffle(round.defenseReplies.map(function (text, index) {
            return { text: text, correct: index === answer };
          }).filter(function (choice) {
            return !choice.correct || knowsGoodComeback;
          }));

        choices.forEach(function (reply) {
          var button = document.createElement("button");
          button.type = "button";
          button.textContent = reply.text;
          button.addEventListener("click", function () {
            replies.querySelectorAll("button").forEach(function (item) {
              item.disabled = true;
            });
            markInsultUsed(playerStarts ? reply.text : round.defensePrompt);

            var exchange = [
              { speaker: "isg", text: reply.text }
            ];

            var pointText;
            var winner;

            if (playerStarts) {
              var matchingDuel = reply.weak ? null : findDuelByInsult(reply.text);
              var matchingComeback = matchingDuel
                ? matchingDuel.defenseReplies[matchingDuel.defenseAnswer]
                : "";

              if (matchingComeback && reviewerAnswersCorrectly()) {
                var learnedAttackComeback = learnComeback(matchingComeback);
                winner = "reviewer";
                pointText = "reviewer answers well. point: reviewer. reviewer starts next.";
                if (learnedAttackComeback) {
                  pointText = "new comeback learned. " + pointText;
                }
                exchange.push({
                  speaker: "reviewer",
                  text: matchingComeback
                });
              } else if (!reply.weak) {
                winner = "player";
                pointText = "reviewer blanks on the comeback. point: isg. isg starts next.";
                exchange.push({
                  speaker: "reviewer",
                  text: "I... need to think about that one."
                });
              } else {
                winner = "reviewer";
                pointText = "reviewer answers well. point: reviewer. reviewer starts next.";
                exchange.push({
                  speaker: "reviewer",
                  text: "That is not even a proper insult."
                });
              }
            } else if (reply.correct) {
              winner = "player";
              pointText = "isg answers well. point: isg. isg starts next.";
              exchange.push({
                speaker: "reviewer",
                text: "I concede that comeback."
              });
            } else {
              winner = "reviewer";
              pointText = "isg misses the comeback. point: reviewer. reviewer starts next.";
              exchange.push({
                speaker: "reviewer",
                text: "That comeback missed the deck entirely."
              });
            }

            roundIndex += 1;
            playExchange(exchange, pointText, winner, drawRound);
          });
          replies.appendChild(button);
        });
      }

      function orderKnownInsults() {
        var strong = [];
        var weak = [];

        knownInsults.forEach(function (insult) {
          var choice = { text: insult.text, weak: insult.weak };

          if (isInsultUsed(insult.text)) {
            return;
          }

          if (insult.weak) {
            weak.push(choice);
            return;
          }

          strong.push(choice);
        });

        return shuffle(strong).concat(shuffle(weak));
      }
    }

    function finishGame() {
      clearDialogueTimers();
      var won = playerScore >= targetScore;
      panel.setAttribute("data-state", won ? "won" : "lost");
      syncScoreboard();
      speaker.textContent = won ? "three-headed reviewer" : "isg";
      line.textContent = won
        ? "I concede. Your security posture is insult-complete."
        : "I need more grog, more patches, and a better comeback.";
      replies.innerHTML = "";
      result.textContent = won ? "You win the duel." : "You lose the duel.";
      retry.hidden = false;
    }

    function resetGame() {
      clearDialogueTimers();
      deck = shuffle(duels.slice());
      starter = "player";
      usedInsults = {};
      knownInsults = loadKnownInsults();
      knownComebacks = loadKnownComebacks();
      roundIndex = 0;
      playerScore = 0;
      rivalScore = 0;
      panel.style.setProperty("--duel-offset", "0");
      retry.hidden = true;
      drawRound();
    }

    drawRound();
    return panel;
  }

  function renderPirateSprite(label, side) {
    var svgNs = "http://www.w3.org/2000/svg";
    var wrapper = document.createElement("div");
    wrapper.className = "pirate pirate-" + side;

    var palette = side === "player" ? {
      coat: "#2456b8",
      coatDark: "#14275f",
      sash: "#f2d38a",
      hat: "#2b170b",
      hatTrim: "#d18a31",
      skin: "#d28a48",
      skinDark: "#a9562c",
      hair: "#16100c",
      boot: "#090909",
      trousers: "#202331"
    } : {
      coat: "#8a2547",
      coatDark: "#461325",
      sash: "#f2d38a",
      hat: "#2b170b",
      hatTrim: "#b7d7ff",
      skin: "#c9854a",
      skinDark: "#8f4d2b",
      hair: "#111111",
      boot: "#080808",
      trousers: "#352636"
    };

    var sprite = document.createElementNS(svgNs, "svg");
    sprite.setAttribute("class", "pirate-sprite");
    sprite.setAttribute("viewBox", "0 0 96 128");
    sprite.setAttribute("aria-hidden", "true");
    sprite.setAttribute("focusable", "false");

    var shadow = svgGroup("part-shadow");
    addRect(shadow, 18, 116, 58, 6, "#050505");

    var legs = svgGroup("part-legs");
    addRect(legs, 31, 80, 12, 34, palette.trousers);
    addRect(legs, 53, 80, 12, 34, palette.trousers);
    addRect(legs, 43, 84, 10, 16, palette.coatDark);
    addRect(legs, 24, 112, 20, 8, palette.boot);
    addRect(legs, 52, 112, 22, 8, palette.boot);

    var body = svgGroup("part-body");
    addRect(body, 24, 53, 48, 38, palette.coat);
    addRect(body, 24, 53, 10, 38, palette.coatDark);
    addRect(body, 62, 56, 10, 34, palette.coatDark);
    addRect(body, 42, 55, 8, 36, palette.sash);
    addRect(body, 30, 49, 36, 9, "#efe4c4");
    addRect(body, 32, 58, 7, 7, "#efe4c4");
    addRect(body, 55, 58, 7, 7, "#efe4c4");
    addRect(body, 33, 68, 6, 5, "#d18a31");
    addRect(body, 55, 68, 6, 5, "#d18a31");
    addRect(body, 28, 77, 40, 7, palette.coatDark);
    addRect(body, 37, 81, 22, 5, "#6a421c");
    addRect(body, 46, 80, 7, 7, "#f2d38a");

    var head = svgGroup("part-head");
    addRect(head, 32, 24, 32, 28, palette.skin);
    addRect(head, 28, 34, 7, 12, palette.skinDark);
    addRect(head, 60, 34, 8, 12, palette.skinDark);
    addRect(head, 31, 25, 6, 23, palette.hair);
    addRect(head, 59, 25, 6, 23, palette.hair);
    addRect(head, 35, 44, 26, 10, palette.hair);
    addRect(head, 38, 34, 8, 5, "#050505");
    addRect(head, 53, 34, 6, 5, "#ffffff");
    addRect(head, 46, 34, 3, 3, "#3a1d11");
    addRect(head, 50, 43, 7, 2, "#3a1d11");
    addRect(head, 39, 25, 22, 8, palette.hair);
    addRect(head, 45, 49, 14, 5, palette.hair);
    addRect(head, 47, 39, 5, 3, palette.skinDark);

    var hat = svgGroup("part-hat");
    addRect(hat, 24, 16, 48, 8, palette.hat);
    addRect(hat, 30, 6, 36, 16, palette.hat);
    addRect(hat, 36, 20, 24, 5, palette.hatTrim);
    addRect(hat, 12, 22, 72, 8, palette.hat);
    addRect(hat, 62, 10, 10, 8, "#b7d7ff");
    addRect(hat, 66, 7, 6, 5, "#ffffff");

    var offArm = svgGroup("part-off-arm");
    addRect(offArm, 13, 58, 13, 29, palette.coatDark);
    addRect(offArm, 12, 83, 13, 8, palette.skinDark);
    addRect(offArm, 11, 62, 5, 17, palette.coat);

    var swordArm = svgGroup("part-sword-arm");
    addRect(swordArm, 65, 57, 13, 29, palette.coat);
    addRect(swordArm, 73, 81, 9, 8, palette.skin);
    addRect(swordArm, 78, 78, 5, 13, "#53371b");
    addRect(swordArm, 80, 37, 5, 43, "#d9ecff");
    addRect(swordArm, 85, 42, 4, 25, "#ffffff");
    addRect(swordArm, 81, 31, 8, 9, "#d9ecff");
    addRect(swordArm, 75, 75, 16, 4, "#f2d38a");
    addRect(swordArm, 86, 34, 4, 6, "#598bd9");
    addRect(swordArm, 78, 91, 7, 4, palette.skinDark);

    sprite.appendChild(shadow);
    sprite.appendChild(legs);
    sprite.appendChild(body);
    sprite.appendChild(offArm);
    sprite.appendChild(swordArm);
    sprite.appendChild(head);
    sprite.appendChild(hat);

    var name = document.createElement("span");
    name.className = "pirate-name";
    name.textContent = label;

    wrapper.appendChild(sprite);
    wrapper.appendChild(name);
    return wrapper;

    function svgGroup(className) {
      var group = document.createElementNS(svgNs, "g");
      group.setAttribute("class", className);
      return group;
    }

    function addRect(parent, x, y, width, height, fill) {
      var rect = document.createElementNS(svgNs, "rect");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(width));
      rect.setAttribute("height", String(height));
      rect.setAttribute("fill", fill);
      parent.appendChild(rect);
      return rect;
    }
  }

  function shuffle(values) {
    for (var index = values.length - 1; index > 0; index -= 1) {
      var swapIndex = Math.floor(Math.random() * (index + 1));
      var current = values[index];
      values[index] = values[swapIndex];
      values[swapIndex] = current;
    }
    return values;
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

  function isAdventureQuery(query) {
    return /\b(monkey|scumm|lucasarts|pirate)\b/.test(query);
  }
}());
