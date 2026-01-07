"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function HomeFaq() {
  return (
    <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/30 dark:border-blue-500/25 shadow-xl dark:shadow-blue-500/10 dark:neon-border">
      <CardContent className="pt-2">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>O total mensal considera apenas o que falta pagar?</AccordionTrigger>
            <AccordionContent>
              Sim. O resumo mensal soma apenas as parcelas ainda não pagas e agrupa por mês.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Posso anexar comprovante no pagamento?</AccordionTrigger>
            <AccordionContent>
              Sim. Ao pagar uma parcela você pode anexar um comprovante opcional (PDF ou imagem).
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Funciona com valores diferentes por parcela?</AccordionTrigger>
            <AccordionContent>
              Sim. Você pode marcar “valor variável por parcela” e informar o valor no momento do pagamento.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}


