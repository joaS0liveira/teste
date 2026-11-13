import type { GeneroContagem } from "@/types";
import { plural } from "@/lib/formatar";
import { Bloco } from "@/components/ui/Bloco";
import { TagIcon } from "@solar-icons/react/linear/tag";

/** Género mais ouvido: a etiqueta (tag) que mais aparece nas audições do período. */
export function Genero({ genero }: { genero: GeneroContagem | null }) {
  return (
    <Bloco titulo="Género mais ouvido" icone={<TagIcon size={20} />} descricao="A etiqueta que mais aparece nas tuas audições.">
      {genero ? (
        <>
          <p className="text-3xl font-semibold first-letter:uppercase">{genero.genero}</p>
          <p className="mt-1 text-sm text-texto-suave">em {plural(genero.contagem, "audição", "audições")}</p>
        </>
      ) : (
        <p className="text-sm text-texto-suave">As audições deste período não têm etiquetas.</p>
      )}
    </Bloco>
  );
}
