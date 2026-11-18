import { WebRTCProtection } from "../../engine/webrtc";
import { chromiumPrivacy } from "../../engine/chromium-privacy";
export const privacyController = new WebRTCProtection(chromiumPrivacy(chrome));
