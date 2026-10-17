"use client";

import { useEffect, useState } from "react";
import { SettingsView, type SettingsSection } from "@/components/views/settings/settings-view";
import { AccountProvider } from "@/contexts/account-context";
import { desktopClient } from "@/lib/desktop-client";

// Temporary evidence route, never part of the PR. Only the desktop IPC boundary
// is replaced. SettingsView and its real AccountView own all visible behavior,
// including Sign Out, catalog invalidation, and the configured-count projection.
export default function EvidencePage() {
	const [ready, setReady] = useState(false);
	const [section, setSection] = useState<SettingsSection>("Providers");
	useEffect(() => {
		let signedIn = true;
		const calls: { command: string; operation?: unknown; provider?: unknown }[] = [];
		const original = desktopClient.invoke;
		desktopClient.invoke = (async (command: string, args?: Record<string, unknown>) => {
			calls.push({ command, operation: args?.operation, provider: args?.provider });
			if (command === "list_provider_catalog") {
				return {
					settingsPath: "/isolated-fixture/providers.json",
					providers: [
						{ id: "cline", name: "Cline", letter: "C", color: "#da7756", models: 0,
							enabled: signedIn, configured: signedIn, oauthAccessTokenPresent: signedIn },
						{ id: "cline-pass", name: "Cline Pass", letter: "P", color: "#69a7ef", models: 0,
							enabled: signedIn, configured: signedIn, oauthAccessTokenPresent: signedIn },
					],
				};
			}
			if (command === "list_provider_models") return { providerId: args?.provider, models: [] };
			if (command === "save_provider_settings") {
				if (args?.provider !== "cline" || args.api_key !== "") {
					throw new Error("This replay only supports the real account sign-out command");
				}
				signedIn = false;
				return {};
			}
			if (command === "cline_account") {
				if (!signedIn) return { signedIn: false, code: "ACCOUNT_NOT_AUTHENTICATED" };
				if (args?.operation === "fetchMe") return {
					id: "isolated-qa-account", email: "qa@example.invalid",
					displayName: "QA user", organizations: [],
				};
				if (args?.operation === "fetchBalance") return { balance: 5000000 };
				if (args?.operation === "fetchUserOrganizations") return [];
				throw new Error(`Unexpected account operation: ${String(args?.operation)}`);
			}
			if (command === "get_global_settings") return { telemetryOptOut: true, autoUpdateEnabled: false };
			throw new Error(`Unexpected desktop command: ${command}`);
		}) as typeof desktopClient.invoke;
		Object.assign(window, { __PR_EVIDENCE__: {
			get signedIn() { return signedIn; }, calls,
		} });
		setReady(true);
		return () => { desktopClient.invoke = original; };
	}, []);

	return (
		<div className="flex h-screen flex-col">
			<div style={{ padding: "12px 24px", borderBottom: "1px solid #444", fontSize: 13 }}>
				Component replay · isolated desktop-transport fixture · not live account authentication
				<nav aria-label="Replay navigation" style={{ display: "flex", gap: 20, marginTop: 8 }}>
					<button onClick={() => setSection("Providers")} type="button">Providers</button>
					<button onClick={() => setSection("Account")} type="button">Account</button>
				</nav>
			</div>
			{ready && <AccountProvider>
				<SettingsView section={section} onNavigateSection={setSection} onExportDiagnostics={() => undefined} />
			</AccountProvider>}
		</div>
	);
}
