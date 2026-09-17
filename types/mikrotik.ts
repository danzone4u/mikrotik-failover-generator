export type WANMode = 'dhcp' | 'static';

export interface WANConfig {
  mode: WANMode;
  interfaceName: string;
  ipAddress?: string; // e.g. "192.168.1.2/24" or "192.168.1.2"
  netmask?: string;   // e.g. "255.255.255.0" or "/24"
  gateway?: string;   // e.g. "192.168.1.1"
  comment?: string;
}

export interface RouterOSConfigParams {
  identity: string;
  adminPassword?: string;
  wan1: WANConfig;
  wan2: WANConfig;             // WAN2 selalu ada
  useRecursiveGateway: boolean; // Option: Gunakan Recursive Gateway atau Standard Check
  failoverCheckHost1?: string;  // Default: 8.8.8.8
  failoverCheckHost2?: string;  // Default: 1.1.1.1
  lanInterface: string;         // Default: bridge-LAN
  lanIpAddress: string;         // e.g. "192.168.99.1/24"
  dnsServers?: string;          // e.g. "8.8.8.8,1.1.1.1"
  enableNat: boolean;
  enableFastTrack: boolean;
}

export interface DirectDeployParams {
  routerIp: string;
  routerPort?: number; // Default 443 or 80 for REST API
  username: string;
  password: string;
  useSsl: boolean;
  configParams: RouterOSConfigParams;
}
