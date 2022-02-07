<h1 align="center">
<img src="https://raw.githubusercontent.com/HirokiCHIBA/timerange-clipboard/main/assets/store/icon.png" alt="icon"><br>
Timerange Clipboard
</h1>

A Chrome Extension to copy and paste URL parameters in any format representing time ranges.  
This makes it easier to go back and forth between multiple monitoring tools with different timestamp formats (e.g. Datadog and Splunk).

## Usage

The icon of this extension will be colored when you visit websites where this extension supports copy and paste of time ranges. Click on the icon to open the popup and click on the Copy or Paste button.

<center>
<img src="https://raw.githubusercontent.com/HirokiCHIBA/timerange-clipboard/main/assets/store/screenshot1.png" alt="icon" width="600">
</center>
<br>

## Supported websites
Any websites that represent time ranges on display as timestamps in two URL query parameters. You can add websites from the options page. The built-in preset supports:

- Datadog
- Splunk
- Grafana
- Lightstep

Note: The providers of these websites are not affiliated with this extension. Please do not contact them about this extension.

## Future works

- Support for shortcuts
- Support for time range representations other than URL query parameters
- Support for relative time representations that are not timestamps (e.g. from=now-1h&to=now)
- Support for a non-developer friendly configuration UI

Note: There is no guarantee that these will be implemented.

## Development

### Lint

```sh
npm run lint
```

### Build

```sh
npm run build
```

### Development Pages with Preview

```sh
npm run dev
```
(Only dist/options works so far.)
