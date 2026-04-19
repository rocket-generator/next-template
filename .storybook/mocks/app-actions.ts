export async function signOutAction() {
  return { success: true };
}

export async function setLanguageAction(locale: string) {
  return { success: true, locale };
}
