# mcp-licenses

Open-source licenses MCP (SPDX).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `lookup_license` | Look up an open-source license by its exact SPDX id (e.g. "MIT", "Apache-2.0", "GPL-3.0-only", "BSD-3-Clause"). Returns the full name, OSI/FSF approval, deprecation status, and reference URLs. Keyless. |
| `search_licenses` | Search the SPDX license list by keyword (matches the id or name), e.g. "GPL", "creative commons", "mozilla". Keyless. |
| `get_license_text` | Fetch the full license text for an SPDX id (e.g. "MIT"). Keyless. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "licenses": {
      "url": "https://gateway.pipeworx.io/licenses/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Licenses data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
