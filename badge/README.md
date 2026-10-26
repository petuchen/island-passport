# Badge

Show that your island speaks Island Passport.

| English | 中文 |
|---|---|
| ![Island Passport](island-passport.svg) | ![小島護照](island-passport-zh.svg) |

## Recommended: host the badge yourself

Copy `island-passport.svg` (or `island-passport-zh.svg`) into your site, for example as `/badge/island-passport.svg`,
then put this in your footer:

```html
<a href="https://github.com/petuchen/island-passport" title="This island speaks Island Passport">
  <img src="/badge/island-passport.svg" alt="Island Passport" width="140" height="28">
</a>
```

For the Chinese badge use `island-passport-zh.svg`, `alt="小島護照"` and `width="94"`.

Self-hosting keeps the promise in [SPEC.md §5](../SPEC.md#5-privacy-and-safety): loading your island contacts no other
site. To point visitors at your own passport instead of this repo, use `href="/island.json"`.

## Quick test only: load it from GitHub

```html
<a href="https://github.com/petuchen/island-passport" title="This island speaks Island Passport">
  <img src="https://raw.githubusercontent.com/petuchen/island-passport/main/badge/island-passport.svg" alt="Island Passport" width="140" height="28">
</a>
```

This works without copying anything, but every visitor's browser then requests the image from GitHub, so don't use it
on a published island.
