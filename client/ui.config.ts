// Thème Nuxt UI : surcharges appliquées à tous les composants concernés
const softFocus =
  'outline-0 focus-visible:outline-0 focus-visible:ring-1 focus-visible:ring-(--ui-text-muted) focus-visible:shadow-[0_0_0_3px_var(--ui-bg-accented)]';

const fieldFocus = ['primary', 'neutral'].flatMap((color) => [
  { color, variant: ['outline', 'subtle'], class: softFocus },
  { color, variant: ['soft', 'ghost'], class: softFocus },
]);

export const uiConfig = {
  colors: { primary: 'stone', neutral: 'stone' },

  // Focus discret : la couleur primaire (encre) donnait un halo noir épais autour des champs
  input: { compoundVariants: fieldFocus },
  textarea: { compoundVariants: fieldFocus },

  chatPrompt: {
    // Plus d'air autour du texte : il ne colle plus au bord arrondi
    slots: {
      root: 'rounded-3xl shadow-sm ps-5 pe-2.5 py-2.5',
      base: 'px-0 py-1.5 text-base leading-6 placeholder:text-dimmed',
    },
    compoundVariants: [
      {
        color: 'neutral',
        variant: 'outline',
        class: {
          root: 'has-[textarea:focus-visible]:outline-0 has-[textarea:focus-visible]:ring-accented',
        },
      },
    ],
  },
};
