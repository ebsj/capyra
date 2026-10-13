import type {
  SocialAccountContract,
  SocialCapabilitiesContract,
  SocialDestinationContract,
  SocialPublicationContract,
  SocialPreflightContract,
  ExternalPostContract,
  SocialMetricSnapshotContract,
  SocialDestinationInputContract,
} from "@/lib/models";
export type SocialAccount = SocialAccountContract;
export type Platform = SocialAccount["platform"];
export type Capabilities = SocialCapabilitiesContract;
export type Destination = SocialDestinationContract;
export type Publication = SocialPublicationContract;
export type Preflight = SocialPreflightContract;
export type ExternalPost = ExternalPostContract;
export type Metric = SocialMetricSnapshotContract;
export type DestinationInput = SocialDestinationInputContract;
