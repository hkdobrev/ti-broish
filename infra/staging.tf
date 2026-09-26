# Staging only. Production tibroish.bg is not managed here.
# The Worker script is uploaded by Workers Builds from apps/web.
# Apply this route only after ti-broish-web-staging exists, and import it
# if Wrangler or the API already created the same pattern.

provider "cloudflare" {}

variable "account_id" {
  type    = string
  default = "579692914a155ab268c22b814cbf8a05"
}

variable "zone_id" {
  type    = string
  default = "0c635b10986f6bd823012916013882ef"
}

resource "cloudflare_workers_route" "staging_web" {
  zone_id = var.zone_id
  pattern = "d1t.tibroish.bg/*"
  script  = "ti-broish-web-staging"
}
