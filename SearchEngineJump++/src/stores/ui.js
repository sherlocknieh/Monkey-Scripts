import { reactive } from 'vue';

export const ui = reactive({
  settingPanelOpen: false,
  toastText: '',
  toastVisible: false,
});

let toastTimer = null;

export function showToast(text, duration = 1500) {
  ui.toastText = text;
  ui.toastVisible = true;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    ui.toastVisible = false;
  }, duration);
}

export function openSettingPanel() {
  ui.settingPanelOpen = true;
}

export function closeSettingPanel() {
  ui.settingPanelOpen = false;
}
