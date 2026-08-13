import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from "lucide-react";

const palette = [
  { name: "Digital Orange", hex: "#FF4200", varName: "--color-digital-orange" },
  { name: "Anti-Flash White", hex: "#ECECEC", varName: "--color-anti-flash-white" },
  { name: "Grey", hex: "#B5B5B5", varName: "--color-grey" },
  { name: "Raisin Black", hex: "#0D0900", varName: "--color-raisin-black" },
];

const statusExamples = [
  {
    label: "Atingido",
    icon: CheckCircle2,
    className: "text-success",
    value: "108%",
  },
  {
    label: "Em risco",
    icon: AlertTriangle,
    className: "text-warning",
    value: "86%",
  },
  {
    label: "Fora da meta",
    icon: XCircle,
    className: "text-danger",
    value: "62%",
  },
  {
    label: "Sem dado",
    icon: MinusCircle,
    className: "text-neutral",
    value: "—",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-12">
        <section className="space-y-2">
          <h1 className="heading text-3xl text-foreground">
            Report Comercial LAKS
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Fundação visual do sistema — paleta, tipografia e componentes
            base antes de entrarmos em autenticação, formulário diário e
            diagnóstico automático.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="heading text-lg text-foreground">Paleta</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {palette.map((color) => (
              <Card key={color.hex}>
                <div
                  className="h-20 rounded-t-lg"
                  style={{ backgroundColor: color.hex }}
                />
                <CardContent className="space-y-0.5 pt-4">
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.hex}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="heading text-lg text-foreground">Tipografia</h2>
          <Card>
            <CardContent className="space-y-3 pt-6">
              <p className="heading text-4xl text-foreground">
                Vendas fechadas
              </p>
              <p className="heading text-2xl text-primary">R$ 1.879,36</p>
              <Separator />
              <p className="text-sm text-foreground">
                Texto corrido usa a fonte de corpo, em caixa normal — para
                formulários, tabelas e parágrafos como este.
              </p>
              <p className="text-xs text-muted-foreground">
                Placeholder: Archivo Expanded + Inter, até os arquivos de
                Neuething Sans e Helvetica Neue serem fornecidos.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="heading text-lg text-foreground">
            Status de meta
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statusExamples.map(({ label, icon: Icon, className, value }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-3 pt-6">
                  <Icon className={`size-6 shrink-0 ${className}`} />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className={`text-xs ${className}`}>{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="heading text-lg text-foreground">Botões</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Enviar report</Button>
            <Button variant="secondary">Salvar rascunho</Button>
            <Button variant="outline">Cancelar</Button>
            <Button variant="ghost">Ver detalhes</Button>
            <Button variant="destructive">Excluir</Button>
            <Badge>Novo</Badge>
            <Badge variant="secondary">Atrasado</Badge>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="heading text-lg text-foreground">
            Exemplo de card de KPI
          </h2>
          <Card className="max-w-sm">
            <CardHeader>
              <CardDescription>Ligações realizadas — hoje</CardDescription>
              <CardTitle className="heading text-3xl">35</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Meta diária: 30 · Ritmo: <span className="text-success">no ritmo</span>
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
