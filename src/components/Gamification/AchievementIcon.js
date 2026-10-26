import React from "react";
import { Footprints, Flame, Shield, GraduationCap, Wallet, Bell, Star, Crown, Award } from "lucide-react";
import Icon from "../DesignSystem/Icon";

export const achievementIcons = { footprints: Footprints, flame: Flame, shield: Shield, "graduation-cap": GraduationCap, wallet: Wallet, bell: Bell, star: Star, crown: Crown };
export const getAchievementIcon = name => Object.prototype.hasOwnProperty.call(achievementIcons, name) ? achievementIcons[name] : Award;
export default function AchievementIcon({ name, ...props }) { return <Icon as={getAchievementIcon(name)} {...props} />; }
