# Cardano Dev Wallet

## Workflow

- Setup: `just setup`
- Run: `just run [browser]`
- Development with auto-reload:
  - Run `just dev [browser]` in background for auto-recompiling.
  - Run `just run [browser]` to launch the extension.
- Bundle: `just bundle [browser]`
- Test: `just test [browser]`

Note:
`[browser]`, if omitted, defaults to `firefox`.
Allowed values: `firefox`, `chrome`.

## Devloper Notes

See [DevNotes.md](DevNotes.md)
