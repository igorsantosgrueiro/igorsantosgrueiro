# santosgrueiro.com

Static personal website with an old-school terminal style.

## Structure

- `index.html`: home page.
- `publications.html`: publications rendered from `publications.bib`.
- `students.html`: student information.
- `more.html`: professional activities, software, and data.
- `assets/styles.css`: shared theme and layout.
- `assets/site.js`: dark/day mode and BibTeX rendering.
- `assets/fonts/`: local old-school PC webfont and license.
- `publications.bib`: single source of truth for publications.

## Local preview

Run a small static server from this folder:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Opening `publications.html` directly as a local file can block `publications.bib`
because browsers restrict `file://` fetches.

## Adding a publication

Add a BibTeX entry to `publications.bib`. The page understands normal BibTeX
fields such as `title`, `author`, `year`, `journal`, `booktitle`, `pages`, `doi`,
and optional custom fields such as `pdf`, `slides`, `talk`, `code`, `data`, and
`media`.

## Font

The terminal face uses `WebPlus IBM VGA 8x14` from The Oldschool PC Font Resource:
https://int10h.org/oldschool-pc-fonts/

The font license is included in `assets/fonts/LICENSE-oldschool-pc-fonts.txt`.
