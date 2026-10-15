import { Button } from '../ui/Button';

/** CTA principal da tela /app/renovar (estado de erro). */
export function RenovarComprarButton() {
  return (
    <Button
      type="button"
      variant="primary"
      size="md"
      className="mt-6 rounded-full text-[#111111] hover:text-[#111111]"
      onClick={() => {
        window.location.assign('/comprar');
      }}
    >
      Renovar meu acesso
    </Button>
  );
}
