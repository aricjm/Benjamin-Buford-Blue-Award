const axios = require('axios');
const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

// 1. Naming helper matching the logic in db.js
const getFilename = (school) => {
  return school.toLowerCase()
    .replace(/\(fl\)/g, 'fl')
    .replace(/\(oh\)/g, 'oh')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-') + '.png';
};

// 2. The Target Directory
const outputDir = path.join(__dirname, '../../frontend/public/logos');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

/**
 * INSTRUCTIONS:
 * 1. Open https://www.sportslogos.net/teams/list_by_league/30/NCAA-Division-I-a-c-Logos/NCAA-a-c-Logos/
 * 2. Right-click anywhere -> Inspect -> Elements.
 * 3. Copy the <ul> or <div> containing the team logos.
 * 4. Paste that HTML into the `htmlSource` variable below.
 */
const htmlSource = `<div class="section" id="team" style="overflow: hidden; width:605px; min-width:605px; padding-bottom:35px; ">
<div class="browseHeading" style="background-color:#007AC3;
                            border-bottom: 4px solid #010101;
                border-right: 5px solid #010101;
                        border-radius: 0px 11px 11px 0px;
            display:flex; align-items:center; height:auto;
            padding:8px 12px;">

    <h3 class="cftr_browseHeading" style="
        font-family:'komu-b', sans-serif;
        font-size:26px;
        font-weight:normal;
        margin:0;
        color:#ffffff;
        letter-spacing:0.08em;
        text-transform:uppercase;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;">
        NCAA i-m Team Logos
    </h3>
</div>

<div class="team-card-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 15px; padding: 20px 20px 0; margin-top: -10px;">
                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/704/Idaho-Vandals-Logos/" title="Idaho Vandals Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/704/thumbs/70424842018.gif" alt="Idaho Vandals Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Idaho Vandals</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1889 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/705/Idaho-State-Bengals-Logos/" title="Idaho State Bengals Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/705/thumbs/70529292019.gif" alt="Idaho State Bengals Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Idaho State Bengals</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1889 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#13284C; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/706/Illinois-Fighting-Illini-Logos/" title="Illinois Fighting Illini Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/706/thumbs/70667022022.gif" alt="Illinois Fighting Illini Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Illinois Fighting Illini</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1867 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#E31937; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/707/Illinois-State-Redbirds-Logos/" title="Illinois State Redbirds Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/707/thumbs/5l5bieqet3144zaiwte9.gif" alt="Illinois State Redbirds Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Illinois State Redbirds</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1964 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#123D70; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/708/Illinois-Chicago-Flames-Logos/" title="Illinois-Chicago Flames Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/708/thumbs/70847702020.gif" alt="Illinois-Chicago Flames Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Illinois-Chicago Flames</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1982 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/5075/Incarnate-Word-Cardinals-Logos/" title="Incarnate Word Cardinals Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/5075/thumbs/507574732011.gif" alt="Incarnate Word Cardinals Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Incarnate Word Cardinals</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1881 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#A90432; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/709/Indiana-Hoosiers-Logos/" title="Indiana Hoosiers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/709/thumbs/indiana-hoosiers-logo-primary-2002-1434-thumb.png" alt="Indiana Hoosiers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Indiana Hoosiers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1820 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#005AAB; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/710/Indiana-State-Sycamores-Logos/" title="Indiana State Sycamores Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/710/thumbs/71088862020.gif" alt="Indiana State Sycamores Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Indiana State Sycamores</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1865 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#900028; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/711/Iona-Gaels-Logos/" title="Iona Gaels Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/711/thumbs/71185382016.gif" alt="Iona Gaels Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Iona Gaels</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1940 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/712/Iowa-Hawkeyes-Logos/" title="Iowa Hawkeyes Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/712/thumbs/71289231979.gif" alt="Iowa Hawkeyes Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Iowa Hawkeyes</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1847 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#98002E; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/713/Iowa-State-Cyclones-Logos/" title="Iowa State Cyclones Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/713/thumbs/iowa-state-cyclones-logo-primary-2008-7194-thumb.png" alt="Iowa State Cyclones Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Iowa State Cyclones</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1858 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#A42133; --color2:#010101; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/703/IUPUI-Jaguars-Logos/" title="IUPUI Jaguars Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/703/thumbs/70394972017.gif" alt="IUPUI Jaguars Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">IUPUI Jaguars</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1969 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#1F3365; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/714/Jackson-State-Tigers-Logos/" title="Jackson State Tigers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/714/thumbs/71471772007.gif" alt="Jackson State Tigers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Jackson State Tigers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1877 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#004d42; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/715/Jacksonville-Dolphins-Logos/" title="Jacksonville Dolphins Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/715/thumbs/71573342018.gif" alt="Jacksonville Dolphins Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Jacksonville Dolphins</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1934 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#CC152C; --color2:#010101; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/716/Jacksonville-State-Gamecocks-Logos/" title="Jacksonville State Gamecocks Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/716/thumbs/84gdv65kg9fdjefh4teoh5355.gif" alt="Jacksonville State Gamecocks Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Jacksonville State Gamecocks</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1883 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#413392; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/717/James-Madison-Dukes-Logos/" title="James Madison Dukes Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/717/thumbs/71751492017.gif" alt="James Madison Dukes Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">James Madison Dukes</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1908 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#0067B1; --color2:#E31A34; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/718/Kansas-Jayhawks-Logos/" title="Kansas Jayhawks Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/718/thumbs/t96oee4doe8n2oxaft7f.gif" alt="Kansas Jayhawks Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Kansas Jayhawks</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1864 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#004a87; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/6704/Kansas-City-Roos-Logos/" title="Kansas City Roos Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/6704/thumbs/670466892019.gif" alt="Kansas City Roos Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Kansas City Roos</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">2019 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#4F2683; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/719/Kansas-State-Wildcats-Logos/" title="Kansas State Wildcats Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/719/thumbs/71944342019.gif" alt="Kansas State Wildcats Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Kansas State Wildcats</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1863 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/4949/Kennesaw-State-Owls-Logos/" title="Kennesaw State Owls Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/4949/thumbs/494943922012.gif" alt="Kennesaw State Owls Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Kennesaw State Owls</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1963 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#003E7E; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/720/Kent-State-Golden-Flashes-Logos/" title="Kent State Golden Flashes Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/720/thumbs/72041732017.gif" alt="Kent State Golden Flashes Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Kent State Golden Flashes</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1910 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#0032A0; --color2:#CAC9CA; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/721/Kentucky-Wildcats-Logos/" title="Kentucky Wildcats Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/721/thumbs/72178322016.gif" alt="Kentucky Wildcats Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Kentucky Wildcats</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1865 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#003768; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/724/La-Salle-Explorers-Logos/" title="La Salle Explorers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/724/thumbs/72445432020.gif" alt="La Salle Explorers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">La Salle Explorers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1863 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#900028; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/725/Lafayette-Leopards-Logos/" title="Lafayette Leopards Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/725/thumbs/7kvjtj9te16n0ipw9e0d5hejz.gif" alt="Lafayette Leopards Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Lafayette Leopards</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1826 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#005596; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/5326/Lake-Superior-State-Lakers-Logos/" title="Lake Superior State Lakers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/5326/thumbs/532655630.gif" alt="Lake Superior State Lakers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Lake Superior State Lakers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1946 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#E51937; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/726/Lamar-Cardinals-Logos/" title="Lamar Cardinals Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/726/thumbs/1htioevlhiz6gi9bqhiwavorf.gif" alt="Lamar Cardinals Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Lamar Cardinals</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1923 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/6865/Le-Moyne-Dolphins-Logos/" title="Le Moyne Dolphins Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/6865/thumbs/686524252018.gif" alt="Le Moyne Dolphins Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Le Moyne Dolphins</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1946 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#663700; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/727/Lehigh-Mountain-Hawks-Logos/" title="Lehigh Mountain Hawks Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/727/thumbs/6915.gif" alt="Lehigh Mountain Hawks Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Lehigh Mountain Hawks</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1865 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#002D62; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/728/Liberty-Flames-Logos/" title="Liberty Flames Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/728/thumbs/72862172013.gif" alt="Liberty Flames Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Liberty Flames</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1971 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/6858/Lindenwood-Lions-Logos/" title="Lindenwood Lions Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/6858/thumbs/685882712021.gif" alt="Lindenwood Lions Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Lindenwood Lions</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1832 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#250858; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/729/Lipscomb-Bisons-Logos/" title="Lipscomb Bisons Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/729/thumbs/lipscomb_bisons_logo_primary_2014sportslogosnet5511.gif" alt="Lipscomb Bisons Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Lipscomb Bisons</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1931 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#74243D; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/5844/Little-Rock-Trojans-Logos/" title="Little Rock Trojans Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/5844/thumbs/584449042016.gif" alt="Little Rock Trojans Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Little Rock Trojans</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">2015 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#59b2e7; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/6705/LIU-Sharks-Logos/" title="LIU Sharks Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/6705/thumbs/670545102019.gif" alt="LIU Sharks Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">LIU Sharks</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">2019 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/730/Long-Beach-State-49ers-Logos/" title="Long Beach State 49ers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/730/thumbs/73010942018.gif" alt="Long Beach State 49ers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Long Beach State 49ers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1940 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#091F3F; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/2609/Longwood-Lancers-Logos/" title="Longwood Lancers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/2609/thumbs/260995192014.gif" alt="Longwood Lancers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Longwood Lancers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1839 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#D73647; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/732/Louisiana-Ragin-Cajuns-Logos/" title="Louisiana Ragin Cajuns Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/732/thumbs/73239682018.gif" alt="Louisiana Ragin Cajuns Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Louisiana Ragin Cajuns</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1898 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#04028c; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/731/Louisiana-Tech-Bulldogs-Logos/" title="Louisiana Tech Bulldogs Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/731/thumbs/eeb5y75gih97igg7lxvph7v4o.gif" alt="Louisiana Tech Bulldogs Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Louisiana Tech Bulldogs</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1894 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#6F002A; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/733/Louisiana-Monroe-Warhawks-Logos/" title="Louisiana-Monroe Warhawks Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/733/thumbs/73317772017.gif" alt="Louisiana-Monroe Warhawks Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Louisiana-Monroe Warhawks</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1931 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#D30E45; --color2:#010101; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/734/Louisville-Cardinals-Logos/" title="Louisville Cardinals Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/734/thumbs/73446722007.gif" alt="Louisville Cardinals Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Louisville Cardinals</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1798 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/735/Loyola-Ramblers-Logos/" title="Loyola Ramblers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/735/thumbs/73557852019.gif" alt="Loyola Ramblers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Loyola Ramblers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1870 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#900028; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/737/Loyola-Marymount-Lions-Logos/" title="Loyola Marymount Lions Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/737/thumbs/73722732019.gif" alt="Loyola Marymount Lions Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Loyola Marymount Lions</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1973 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#005746; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/736/Loyola-Maryland-Greyhounds-Logos/" title="Loyola-Maryland Greyhounds Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/736/thumbs/73667562019.gif" alt="Loyola-Maryland Greyhounds Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Loyola-Maryland Greyhounds</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1852 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#5C2A83; --color2:#FCC525; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/723/LSU-Tigers-Logos/" title="LSU Tigers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/723/thumbs/s4dleiha8ddfi6cdweqjtgeq9.gif" alt="LSU Tigers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">LSU Tigers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1860 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#3698D4; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/738/Maine-Black-Bears-Logos/" title="Maine Black Bears Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/738/thumbs/blkfbg8zghmh0m8i7v9lrl5c6.gif" alt="Maine Black Bears Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Maine Black Bears</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1865 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#00703C; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/739/Manhattan-Jaspers-Logos/" title="Manhattan Jaspers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/739/thumbs/73917732012.gif" alt="Manhattan Jaspers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Manhattan Jaspers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1853 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#E31837; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/740/Marist-Red-Foxes-Logos/" title="Marist Red Foxes Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/740/thumbs/x8kgikten7tgkyx12bgfx1f9f.gif" alt="Marist Red Foxes Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Marist Red Foxes</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1929 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#003671; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/741/Marquette-Golden-Eagles-Logos/" title="Marquette Golden Eagles Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/741/thumbs/lk47sf36h6g3y141mktt.gif" alt="Marquette Golden Eagles Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Marquette Golden Eagles</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1881 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#007631; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/742/Marshall-Thundering-Herd-Logos/" title="Marshall Thundering Herd Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/742/thumbs/74222742015.gif" alt="Marshall Thundering Herd Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Marshall Thundering Herd</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1837 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#E31937; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/743/Maryland-Terrapins-Logos/" title="Maryland Terrapins Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/743/thumbs/74354442012.gif" alt="Maryland Terrapins Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Maryland Terrapins</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1807 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/744/Maryland-Eastern-Shore-Hawks-Logos/" title="Maryland-Eastern Shore Hawks Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/744/thumbs/74419382022.gif" alt="Maryland-Eastern Shore Hawks Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Maryland-Eastern Shore Hawks</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1886 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#A90533; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/887/Massachusetts-Minutemen-Logos/" title="Massachusetts Minutemen Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/887/thumbs/88735242021.gif" alt="Massachusetts Minutemen Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Massachusetts Minutemen</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1863 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#00529B; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/745/McNeese-State-Cowboys-Logos/" title="McNeese State Cowboys Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/745/thumbs/74570442011.gif" alt="McNeese State Cowboys Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">McNeese State Cowboys</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1939 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#00498F; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/746/Memphis-Tigers-Logos/" title="Memphis Tigers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/746/thumbs/74692712021.gif" alt="Memphis Tigers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Memphis Tigers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1912 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/747/Mercer-Bears-Logos/" title="Mercer Bears Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/747/thumbs/2533.gif" alt="Mercer Bears Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Mercer Bears</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1833 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#065951; --color2:#052654; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/5328/Mercyhurst-Lakers-Logos/" title="Mercyhurst Lakers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/5328/thumbs/532889212018.gif" alt="Mercyhurst Lakers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Mercyhurst Lakers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1926 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#003768; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/5022/Merrimack-Warriors-Logos/" title="Merrimack Warriors Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/5022/thumbs/merrimack_warriors_logo_primary_2006sportslogosnet1135.gif" alt="Merrimack Warriors Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Merrimack Warriors</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1947 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#144734; --color2:#EC7825; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/748/Miami-Hurricanes-Logos/" title="Miami Hurricanes Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/748/thumbs/miami_hurricanes_logo_primary_2024sportslogosnet7626.gif" alt="Miami Hurricanes Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Miami Hurricanes</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1925 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/749/Miami-Ohio-Redhawks-Logos/" title="Miami (Ohio) Redhawks Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/749/thumbs/74994712014.gif" alt="Miami (Ohio) Redhawks Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Miami (Ohio) Redhawks</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1997 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#00285D; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/750/Michigan-Wolverines-Logos/" title="Michigan Wolverines Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/750/thumbs/75032372016.gif" alt="Michigan Wolverines Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Michigan Wolverines</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1817 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#025B40; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/751/Michigan-State-Spartans-Logos/" title="Michigan State Spartans Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/751/thumbs/75112152010.gif" alt="Michigan State Spartans Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Michigan State Spartans</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1855 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/5058/Michigan-Tech-Huskies-Logos/" title="Michigan Tech Huskies Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/5058/thumbs/505884202016.gif" alt="Michigan Tech Huskies Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Michigan Tech Huskies</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1885 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#84161B; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/753/Minnesota-Golden-Gophers-Logos/" title="Minnesota Golden Gophers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/753/thumbs/r8cdw98hpgz0sevha7ejthble.gif" alt="Minnesota Golden Gophers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Minnesota Golden Gophers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1851 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#673B79; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/5079/Minnesota-State-Mavericks-Logos/" title="Minnesota State Mavericks Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/5079/thumbs/507958082001.gif" alt="Minnesota State Mavericks Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Minnesota State Mavericks</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1868 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#892034; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/5056/Minnesota-Duluth-Bulldogs-Logos/" title="Minnesota-Duluth Bulldogs Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/5056/thumbs/505691091996.gif" alt="Minnesota-Duluth Bulldogs Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Minnesota-Duluth Bulldogs</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1902 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#E41D38; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/754/Mississippi-Rebels-Logos/" title="Mississippi Rebels Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/754/thumbs/75416092020.gif" alt="Mississippi Rebels Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Mississippi Rebels</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1844 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#64262C; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/755/Mississippi-State-Bulldogs-Logos/" title="Mississippi State Bulldogs Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/755/thumbs/mississippi_state_bulldogs_logo_primary_2024sportslogosnet5254.gif" alt="Mississippi State Bulldogs Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Mississippi State Bulldogs</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1878 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#000000; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/757/Missouri-Tigers-Logos/" title="Missouri Tigers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/757/thumbs/75746882018.gif" alt="Missouri Tigers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Missouri Tigers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1839 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#762123; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/4974/Missouri-State-Bears-Logos/" title="Missouri State Bears Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/4974/thumbs/497490162006.gif" alt="Missouri State Bears Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Missouri State Bears</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">2006 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#2F3E69; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/758/Monmouth-Hawks-Logos/" title="Monmouth Hawks Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/758/thumbs/75894422014.gif" alt="Monmouth Hawks Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Monmouth Hawks</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1933 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#702E3E; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/759/Montana-Grizzlies-Logos/" title="Montana Grizzlies Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/759/thumbs/8w2u1hfnzaaqrqh0wy6hmgeh9.gif" alt="Montana Grizzlies Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Montana Grizzlies</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1893 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#00205C; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/760/Montana-State-Bobcats-Logos/" title="Montana State Bobcats Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/760/thumbs/76067842013.gif" alt="Montana State Bobcats Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Montana State Bobcats</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1893 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#005DAA; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/761/Morehead-State-Eagles-Logos/" title="Morehead State Eagles Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/761/thumbs/76179632021.gif" alt="Morehead State Eagles Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Morehead State Eagles</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1887 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#F47937; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/762/Morgan-State-Bears-Logos/" title="Morgan State Bears Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/762/thumbs/76275832002.gif" alt="Morgan State Bears Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Morgan State Bears</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1867 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#075697; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/763/Mount-St-Marys-Mountaineers-Logos/" title="Mount St. Marys Mountaineers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/763/thumbs/76311752016.gif" alt="Mount St. Marys Mountaineers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size:13px; font-weight: bold;">Mount St. Marys Mountaineers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1808 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#0066A4; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/752/MTSU-Blue-Raiders-Logos/" title="MTSU Blue Raiders Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/752/thumbs/75282132019.gif" alt="MTSU Blue Raiders Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">MTSU Blue Raiders</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1911 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#043264; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/764/Murray-State-Racers-Logos/" title="Murray State Racers Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/764/thumbs/76425102014.gif" alt="Murray State Racers Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">Murray State Racers</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1922 - Pres</span>
        </div>
    </a>
</div>

                    <div class="team-card" style="--color1:#00693F; --color2:#000000; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
    <a href="/logos/list_by_team/756/MVSU-Delta-Devils-Logos/" title="MVSU Delta Devils Logos" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 10px;">
            <img src="https://content.sportslogos.net/logos/32/756/thumbs/6924.gif" alt="MVSU Delta Devils Logo" style="height: 100px; width: 150px; object-fit: contain; display: block; margin: 0 auto;" loading="lazy">
        </div>
        <div class="card-text" style="padding: 10px; font-family: 'Arial', sans-serif; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
            <span style="display: block; font-size: 16px; font-weight: bold;">MVSU Delta Devils</span>
            <span style="display: block; font-size: 10px; margin-top: 4px;">1946 - Pres</span>
        </div>
    </a>
</div>

    </div>

</div>`;

async function processLogos() {
  // Regex to extract team name and gif source
  // Based on sportslogos.net structure: <img src="...gif" alt="Team Name">
  const regex = /<img src="([^"]+\.gif)" alt="([^"]+)"/g;
  let match;
  let count = 0;

  console.log('Starting logo extraction...');

  while ((match = regex.exec(htmlSource)) !== null) {
    const gifUrl = match[1];
    const fullName = match[2].replace(/&amp;/g, '&'); // Fix HTML entities like A&M
    
    // Extract school name: remove " Logo" and the nickname.
    // format is "[School Name] [Nickname] Logo"
    const parts = fullName.split(' ');
    // slice(0, -2) removes the last two words ("Hurricanes" and "Logo")
    // This converts "Miami (FL) Hurricanes Logo" -> "Miami (FL)"
    const schoolName = parts.length > 2 ? parts.slice(0, -2).join(' ') : parts[0];

    const filename = getFilename(schoolName);
    const outputPath = path.join(outputDir, filename);

    try {
      console.log(`Downloading: ${schoolName} -> ${filename}`);
      const response = await axios.get(gifUrl, { responseType: 'arraybuffer' });

      // Convert GIF to PNG using Jimp (Pure JS image processing)
      const image = await Jimp.read(Buffer.from(response.data));
      await image.write(outputPath);
      
      count++;
    } catch (err) {
      console.error(`Failed to process ${fullName}:`, err.message);
    }
  }
  console.log('Logos will be saved to:', outputDir);
  console.log(`Done! Successfully processed ${count} logos.`);
}

if (htmlSource === 'PASTE_COPIED_HTML_HERE') {
  console.log('Please paste the HTML source into the script before running.');
} else {
  processLogos();
}