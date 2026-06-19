import { NextRequest, NextResponse } from 'next/server';

const TITLES: Record<string, string[]> = {
  vencimiento_proximo: [
    "¡Tu membresía está por vencer! Renueva y ahorra {descuento}%",
    "⏰ Últimos días: {descuento}% OFF en tu renovación",
    "No dejes vencer tu membresía — {descuento}% de descuento",
    "¡Renueva ahora y obtén {descuento}% de descuento!",
    "Tu cuerpo te pide más. Renueva con {descuento}% OFF",
    "¡La cuenta regresiva comenzó! {descuento}% en renovación",
    "Sigue entrenando: renueva con {descuento}% de descuento",
    "Membresía por vencer — Aprovecha {descuento}% OFF",
  ],
  membresia_expirada: [
    "¡Te extrañamos! Vuelve con {descuento}% de descuento",
    "Tu lugar te espera — {descuento}% OFF en tu regreso",
    "¡Nunca es tarde! Regresa con {descuento}% de descuento",
    "Te estamos esperando: {descuento}% en tu nueva membresía",
    "¡Reactivado! Obtén {descuento}% al regresar",
    "El gym no es lo mismo sin ti — Vuelve con {descuento}% OFF",
    "Segunda oportunidad: {descuento}% de descuento en tu regreso",
    "¡Hora de volver! {descuento}% OFF para exmiembros",
  ],
  bienvenida: [
    "¡Bienvenido! Obtén {descuento}% en tu primera membresía",
    "Empieza hoy: {descuento}% OFF para nuevos miembros",
    "¡Únete a la familia! {descuento}% de descuento en tu inicio",
    "Comienza tu transformación con {descuento}% de descuento",
    "Primera membresía con {descuento}% OFF — ¡Aprovecha!",
    "¡Nuevo en el gym? {descuento}% de descuento para ti",
    "Tu viaje fitness empieza aquí: {descuento}% OFF",
    "Oferta de bienvenida: {descuento}% de descuento",
  ],
  especial: [
    "🔥 Oferta especial: {descuento}% de descuento por tiempo limitado",
    "¡Promoción exclusiva! {descuento}% OFF para ti",
    "No te lo pierdas: {descuento}% de descuento en membresías",
    "¡Aprovecha esta oferta! {descuento}% de descuento",
    "Oferta relámpago: {descuento}% OFF — Válido hasta agotar existencias",
    "¡Solo por hoy! {descuento}% de descuento en tu membresía",
    "Promoción especial del mes: {descuento}% de descuento",
    "¡Descuento imperdible! {descuento}% OFF en membresías",
  ],
};

const TEMPLATES: Record<string, string[]> = {
  vencimiento_proximo: [
    "¡Hola {nombre}! 🎉\n\n⏰ ¡Tu membresía está por vencer! No dejes pasar esta oportunidad.\n\n📌 {titulo}\n💰 {descuento}% de descuento\n📅 Válido hasta el {finPromocion}\n\n🏃 Sigue entrenando y alcanza tus metas. ¡Renueva ahora y obtén este descuento exclusivo! 🔥\n\nTe esperamos 💪",
    "¡Hola {nombre}! 🔥\n\n⚠️ Tu membresía está a punto de vencer. Pero tenemos buenas noticias...\n\n📌 {titulo}\n💰 {descuento}% OFF\n📅 Válido hasta el {finPromocion}\n\n💪 No detengas tu progreso. Aprovecha este descuento y sigue entrenando al máximo.\n\nTe esperamos 🏋️",
    "¡Hola {nombre}! ⚡\n\n⏳ El tiempo se acaba... Tu membresía está por vencer y tenemos una oferta para ti.\n\n📌 {titulo}\n💰 {descuento}% de descuento\n📅 Válido hasta el {finPromocion}\n\n🏋️ Renueva ahora y sigue rompiendo tus límites. ¡Te esperamos! 🔥",
  ],
  membresia_expirada: [
    "¡Hola {nombre}! 💪\n\n😢 ¡Te extrañamos en el gym! Los pesas te esperan...\n\n📌 {titulo}\n💰 {descuento}% de descuento\n📅 Válido hasta el {finPromocion}\n\n🏋️ Regresa con más fuerza que nunca. Te tenemos una oferta especial para que retomes tu entrenamiento. ¡Te esperamos! 🔥",
    "¡Hola {nombre}! 🎉\n\n🤗 ¡Qué bueno verte de nuevo! Sabemos que has estado fuera pero siempre hay tiempo para volver.\n\n📌 {titulo}\n💰 {descuento}% OFF\n📅 Válido hasta el {finPromocion}\n\n💪 Tu cuerpo te necesita. Regresa con todo y aprovecha esta oferta exclusiva.\n\nTe esperamos 🏋️",
    "¡Hola {nombre}! 🔥\n\n⭐ ¡Nunca es tarde para retomar el camino! Te hemos preparado una oferta especial.\n\n📌 {titulo}\n💰 {descuento}% de descuento\n📅 Válido hasta el {finPromocion}\n\n🏃 El primer paso es el más difícil, pero ya lo diste antes. ¡Vuelve a brillar! 💪",
  ],
  bienvenida: [
    "¡Hola {nombre}! 🎉\n\n👋 ¡Bienvenido a la familia del gym! Estamos felices de tenerte con nosotros.\n\n📌 {titulo}\n💰 {descuento}% de descuento\n📅 Válido hasta el {finPromocion}\n\n💪 Empieza hoy tu transformación. Contamos con todo lo que necesitas para alcanzar tus metas. ¡Te esperamos! 🔥",
    "¡Hola {nombre}! ⭐\n\n🤝 ¡Qué emoción darte la bienvenida! Prepara para comenzar esta nueva aventura.\n\n📌 {titulo}\n💰 {descuento}% OFF\n📅 Válido hasta el {finPromocion}\n\n🏋️ Este es el comienzo de un nuevo tú. Instalaciones de primer nivel y el mejor equipo te esperan.\n\nTe esperamos 💪",
    "¡Hola {nombre}! 🔥\n\n🎊 ¡Felicidades por dar el primer paso! Tu nueva vida fitness comienza hoy.\n\n📌 {titulo}\n💰 {descuento}% de descuento\n📅 Válido hasta el {finPromocion}\n\n✨ Cada gran logro comienza con la decisión de intentarlo. ¡Nosotros te acompañamos en el camino!\n\nTe esperamos 🏋️",
  ],
  especial: [
    "¡Hola {nombre}! 🎉\n\n🎊 Tenemos una oferta especial que no puedes dejar pasar.\n\n📌 {titulo}\n💰 {descuento}% de descuento\n📅 Válido hasta el {finPromocion}\n\n✨ Esta promoción es por tiempo limitado. Aprovecha ahora y asegura tu membresía con este descuento exclusivo. 🔥\n\nTe esperamos 💪",
    "¡Hola {nombre}! 🔥\n\n⚡ ¡Atención! Esta oferta es demasiado buena para ignorarla.\n\n📌 {titulo}\n💰 {descuento}% OFF\n📅 Válido hasta el {finPromocion}\n\n🎯 No dejes pasar esta oportunidad única. Mejora tu membresía y disfruta de todos los beneficios.\n\nTe esperamos 🏋️",
    "¡Hola {nombre}! ⭐\n\n🎁 ¡Sorpresa! Tenemos una promoción exclusiva especialmente para ti.\n\n📌 {titulo}\n💰 {descuento}% de descuento\n📅 Válido hasta el {finPromocion}\n\n💪 Lo mejor está por venir. Asegura este precio especial y prepárate para dar lo mejor de ti.\n\nTe esperamos 🔥",
  ],
};

function generateTitle(tipo: string, descuento: number): string {
  const titles = TITLES[tipo] || TITLES.especial;
  const title = titles[Math.floor(Math.random() * titles.length)];
  return title.replace(/{descuento}/g, descuento.toString());
}

function generateTemplate(tipo: string, titulo: string, descuento: number, finPromocion: string): string {
  const templates = TEMPLATES[tipo] || TEMPLATES.especial;
  const template = templates[Math.floor(Math.random() * templates.length)];
  const fechaFin = finPromocion
    ? new Date(finPromocion).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "";
  return template
    .replace(/{titulo}/g, titulo)
    .replace(/{descuento}/g, descuento.toString())
    .replace(/{finPromocion}/g, fechaFin);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo = "especial", descuento = 0, finPromocion = "" } = body;

    if (!tipo) {
      return NextResponse.json({ error: "El tipo de promoción es requerido" }, { status: 400 });
    }

    // Generar título
    const titulo = generateTitle(tipo, descuento);
    
    // Generar plantilla basada en el título generado
    const plantilla = generateTemplate(tipo, titulo, descuento, finPromocion);

    return NextResponse.json({
      titulo,
      plantillaWhatsApp: plantilla,
      tipo,
    });
  } catch (error) {
    console.error("Error en generación IA:", error);
    return NextResponse.json(
      { error: "Error al generar contenido con IA" },
      { status: 500 }
    );
  }
}