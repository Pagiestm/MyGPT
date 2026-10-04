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

  // Croix centrée sur la première ligne du titre (bouton de 32 px, ligne de 24 px)
  modal: { slots: { close: 'absolute top-3 end-4' } },
  slideover: { slots: { close: 'absolute top-3 end-4' } },
  textarea: { compoundVariants: fieldFocus },

  // Toutes les zones de saisie du chat (nouveau message, modification) partagent cette forme
  chatPrompt: {
    slots: {
      root: 'rounded-(--radius-field) p-4',
      base: 'px-2 py-1.5 text-base leading-6 placeholder:text-dimmed',
    },
    compoundVariants: [
      {
        color: 'neutral',
        variant: 'outline',
        class: {
          root: 'shadow-sm has-[textarea:focus-visible]:outline-0 has-[textarea:focus-visible]:ring-accented',
        },
      },
      {
        color: 'neutral',
        variant: 'soft',
        class: { root: 'has-[textarea:focus-visible]:outline-0' },
      },
    ],
  },
  chatPromptSubmit: { slots: { base: 'rounded-full' } },
};
