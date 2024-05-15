Dynamsoft.License.LicenseManager.initLicense("DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==");
Dynamsoft.Core.CoreModule.loadWasm(["cvr", "dbr", "dlr",]);
(async () => {
    await Dynamsoft.DLR.LabelRecognizerModule.loadRecognitionData("Letter");
    let router = await Dynamsoft.CVR.CaptureVisionRouter.createInstance();

    let view = await Dynamsoft.DCE.CameraView.createInstance();
    let cameraEnhancer = await Dynamsoft.DCE.CameraEnhancer.createInstance(view);

    document.querySelector("#cameraViewContainer").append(view.getUIElement());
    router.setInput(cameraEnhancer);

    const resultsContainer = document.querySelector("#results");
    const resultReceiver = new Dynamsoft.CVR.CapturedResultReceiver();

    let lastResult = {};

    resultReceiver.onCapturedResultReceived = (result) => {
        if (result.items.length == 0) {
            resultsContainer.textContent = '';
        }
    }

    resultReceiver.onDecodedBarcodesReceived = (result) => {
        if (!lastResult["id"]) {
            lastResult["id"] = result.originalImageTag.imageId;
        }
        else {
            if (lastResult["id"] !== result.originalImageTag.imageId) {
                resultsContainer.textContent = '';
                lastResult["id"] = result.originalImageTag.imageId;
            }
        }

        if (result.barcodeResultItems.length > 0) {
            for (let item of result.barcodeResultItems) {
                resultsContainer.textContent += `Barcode Type: ${item.formatString}, Value: ${item.text}\n\n`;
            }
        }
    }

    resultReceiver.onRecognizedTextLinesReceived = (result) => {
        if (!lastResult["id"]) {
            lastResult["id"] = result.originalImageTag.imageId;
        }
        else {
            if (lastResult["id"] !== result.originalImageTag.imageId) {
                resultsContainer.textContent = '';
                lastResult["id"] = result.originalImageTag.imageId;
            }
        }

        if (result.textLineResultItems.length > 0) {
            for (let item of result.textLineResultItems) {
                resultsContainer.textContent += `Text: ${item.text}\n`;
            }
        }
    };
    router.addResultReceiver(resultReceiver);

    let filter = new Dynamsoft.Utility.MultiFrameResultCrossFilter();
    filter.enableResultCrossVerification(Dynamsoft.Core.EnumCapturedResultItemType.CRIT_BARCODE | Dynamsoft.Core.EnumCapturedResultItemType.CRIT_TEXT_LINE, true);
    filter.enableResultDeduplication(Dynamsoft.Core.EnumCapturedResultItemType.CRIT_BARCODE | Dynamsoft.Core.EnumCapturedResultItemType.CRIT_TEXT_LINE, true);
    await router.addResultFilter(filter);

    let settings = {
        "CaptureVisionTemplates": [
            {
                "Name": "ReadBarcode&AccompanyText",
                "ImageROIProcessingNameArray": [
                    "roi-read-barcodes-only", "roi-read-text"
                ]
            }
        ],
        "TargetROIDefOptions": [
            {
                "Name": "roi-read-barcodes-only",
                "TaskSettingNameArray": ["task-read-barcodes"]
            },
            {
                "Name": "roi-read-text",
                "TaskSettingNameArray": ["task-read-text"],
                "Location":
                {
                    "ReferenceObjectFilter": {
                        "ReferenceTargetROIDefNameArray": ["roi-read-barcodes-only"]
                    },
                    "Offset": {
                        "MeasuredByPercentage": 1,
                        "FirstPoint": [-20, -50],
                        "SecondPoint": [150, -50],
                        "ThirdPoint": [150, -5],
                        "FourthPoint": [-20, -5]
                    }
                }
            }
        ],
        "CharacterModelOptions": [
            {
                "Name": "Letter"
            }
        ],
        "ImageParameterOptions": [
            {
                "Name": "ip-read-text",
                "TextureDetectionModes": [
                    {
                        "Mode": "TDM_GENERAL_WIDTH_CONCENTRATION",
                        "Sensitivity": 8
                    }
                ],
                "TextDetectionMode": {
                    "Mode": "TTDM_LINE",
                    "CharHeightRange": [
                        20,
                        1000,
                        1
                    ],
                    "Sensitivity": 7
                }
            }
        ],
        "TextLineSpecificationOptions": [
            {
                "Name": "tls-11007",
                "CharacterModelName": "Letter",
                "StringRegExPattern": "(SerialNumber){(12)}|(LotNumber){(9)}",
                "StringLengthRange": [9, 12],
                "CharHeightRange": [5, 1000, 1],
                "BinarizationModes": [
                    {
                        "BlockSizeX": 30,
                        "BlockSizeY": 30,
                        "Mode": "BM_LOCAL_BLOCK",
                        "MorphOperation": "Close"
                    }
                ]
            }
        ],
        "BarcodeReaderTaskSettingOptions": [
            {
                "Name": "task-read-barcodes",
                "BarcodeFormatIds": ["BF_ONED"]
            }
        ],
        "LabelRecognizerTaskSettingOptions": [
            {
                "Name": "task-read-text",
                "TextLineSpecificationNameArray": [
                    "tls-11007"
                ],
                "SectionImageParameterArray": [
                    {
                        "Section": "ST_REGION_PREDETECTION",
                        "ImageParameterName": "ip-read-text"
                    },
                    {
                        "Section": "ST_TEXT_LINE_LOCALIZATION",
                        "ImageParameterName": "ip-read-text"
                    },
                    {
                        "Section": "ST_TEXT_LINE_RECOGNITION",
                        "ImageParameterName": "ip-read-text"
                    }
                ]
            }
        ]
    }
    await router.initSettings(settings);

    await cameraEnhancer.open();
    await router.startCapturing("ReadBarcode&AccompanyText");
})();