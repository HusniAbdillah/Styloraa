# UI components

The shared UI source lives in `src/components/arc`. It is installed from the free UIArc registry and can be imported as local project code. Keep shared primitives here; feature-specific compositions belong in their feature folders.

## Installed components

- `button`, `card`, `badge`
- `input`, `textarea`, `select`, `checkbox`
- `dialog`, `tabs`
- `empty-state`, `skeleton`, `toast`
- `file-dropzone`

Arc's shared motion tokens and CSS foundation are in `src/components/arc`; the foundation is loaded once by the root layout. The source uses CSS modules and keeps its own tokens so it can be adopted without replacing Stylora's existing Tailwind theme.

## Icons

Use `@radix-ui/react-icons` for application icons. Import the icon component directly from the package and provide an accessible label when an icon is the only content in a control. UIArc may include its own icon dependencies internally; application features should use Radix Icons for consistency.

## Adding another Arc component

The `components.json` file registers the `@uiarc` source. Install another free component with:

```sh
npx shadcn@latest add @uiarc/<component-name>
```

The CLI places the editable source under `src/components/arc`. Import components from there; do not fetch registry source at runtime.
