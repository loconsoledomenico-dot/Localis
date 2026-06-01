export type CheckoutProduct =
  | 'single'
  | 'custom'
  | 'tris'
  | 'sestina'
  | 'puglia-completa'
  | 'bari-completa'
  | 'valle-completa'
  | 'gargano-completa'
  | 'crociera';

export type CheckoutRedirectPayload = {
  product: CheckoutProduct;
  lang: string;
  guideSlug?: string;
  selectedSlugs?: string[];
};

export function submitCheckoutRedirect(payload: CheckoutRedirectPayload): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/checkout?redirect=1';
  form.hidden = true;

  appendField(form, 'product', payload.product);
  appendField(form, 'lang', payload.lang);

  if (payload.guideSlug) {
    appendField(form, 'guideSlug', payload.guideSlug);
  }

  for (const slug of payload.selectedSlugs ?? []) {
    appendField(form, 'selectedSlugs', slug);
  }

  document.body.appendChild(form);
  form.submit();
}

function appendField(form: HTMLFormElement, name: string, value: string): void {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  form.appendChild(input);
}
