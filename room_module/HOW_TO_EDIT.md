How to Edit the IITGN Space Allocation App

(Simple step-by-step guide for beginners)

This document tells you exactly how to change data, add rooms, change floor plans, and update what people see on the screen.



1. How to change room data (allocation, type, add new rooms, etc.)

Room data can come from the local Excel workbook or, when configured, a Google Sheet.
The Google Sheet link is intentionally shown as a placeholder in the app until you add
the link. The existing local Excel workflow continues to work if Google Sheets is not
configured.

Step-by-step:





Open the Excel file:

frontend/data/CD Office Master Space Allocation.xlsx

If using Google Sheets instead, use the tab layout described in section 7.



Find the sheet for the building you want to change (for example AB3, AB4, AB5…).



Edit any cell you want:





Room number



Type (Office, Lab, Classroom, Utility, Meeting Room, etc.)



Allocation



Intended allocation



To add a completely new room:





Go to the correct floor section inside that building sheet.



Add a new row with Building, Room, Type, Allocation, Intended allocation.



Save the Excel file.



Re-generate the data file that the website uses:





Open a terminal in the room_module/frontend folder.



Run the parser script:

python scripts\parse_excel.py data\CD Office Master Space Allocation.xlsx



This updates frontend/public/all_spaces.json.



Refresh the website in the browser (press F5 or Ctrl+R).
The new data should now appear.



Important: After changing the local Excel workbook, run the parser script. Saving the
workbook alone does not update app data. For Google Sheets, an admin can click
Sync Spreadsheet in the app; the button fetches the latest data from the configured
Google Sheet endpoint.



2. How to change / add a floor plan image (blueprint)

Each building + floor has its own image.

Naming rule (very important)

The image file name is built like this:

{building in lowercase}_{floor with spaces turned into underscores}.png

Exact examples







Building



Floor



File name you must use





AB3



Ground Floor



ab3_ground_floor.png





AB3



First Floor



ab3_first_floor.png





AB3



Second Floor



ab3_second_floor.png





AB4



Ground Floor



ab4_ground_floor.png





AB4



First Floor



ab4_first_floor.png





AB5



Second Floor



ab5_second_floor.png





AB13



Third Floor



ab13_third_floor.png

Rules:





Building code → lowercase (AB3 → ab3)



Floor name → all lowercase, spaces become underscores



File extension → .png (recommended)

Where to put the image

Put the file inside the public folder:

frontend/public/ab3_ground_floor.png
frontend/public/ab3_first_floor.png
frontend/public/ab3_second_floor.png
...

Steps to add or change a floor plan





Prepare the floor plan image (PNG is best).



Rename it exactly according to the table above
(example: for AB3 Ground Floor → ab3_ground_floor.png).



Copy the file into the public folder.



If a file with the same name already exists, replace it.



Refresh the website in the browser (F5 or Ctrl+R).



Select the correct building and floor.



Click Show Blueprint if the background is hidden.

That’s it. The correct image will appear for that floor.

Note about the old single-image naming

Previously the app used only one image per building (ab3_floorplan.png).
That is no longer used. You must now use the per-floor names shown above.



3. How to move / resize the room boxes on the visual map

Only admin users can do this.





Click the Login button (top right).



Use the default admin account (or any admin account you created):





Username: admin



Password: admin123



After login you will see “admin” next to your name.



Go to Visual Layout.



Drag any room box to move it.



Hover over a box → a small blue circle appears at the bottom-right corner → drag that circle to resize.



When you are happy with the positions, click the blue Save Layout button.



The positions are saved permanently for that building + floor.

Guests (people who are not logged in, or logged in as guest) can only look and click on rooms. They cannot move or save anything.



4. How to add more admin users





Login as an existing admin.



Click the + Admin button (next to your username).



Type a new username and password (password must be at least 6 characters).



Click Create Admin.



The new person can now login with those details and will also be able to edit layouts.

The app currently supports admin accounts and the built-in guest view. There is no
separate regular-user registration or user-management screen.



5. Where important files live







What you want to change



File / Folder





Room data (Excel source)



frontend/data/CD Office Master Space Allocation.xlsx





Cached data the website reads



frontend/public/all_spaces.json





Floor plan images



public/abX_ground_floor.png, abX_first_floor.png, etc.





Saved box positions



public/layouts/AB3_Ground_Floor.json (etc.)





Admin usernames & passwords



frontend/data/users.json (passwords are hashed)





Login & save code



app/api/... and lib/auth.ts



6. Common problems & fixes

I changed the local Excel but nothing changed on the website
→ Run the Python parser from frontend/ and refresh the browser. For Google Sheets,
   verify GOOGLE_APPS_SCRIPT_URL and use the admin sync button.

The floor plan image does not appear
→ Check the file name follows the per-floor rule exactly (example: ab3_ground_floor.png) and it is inside the public folder.
→ Make sure you selected the matching floor in the app. I cannot drag the boxes
→ You are not logged in as admin. Click Login and use an admin account.

Save Layout button says error
→ Make sure you are logged in as admin. Also check that the public/layouts folder exists and the server can write files.

I want to change the default admin password
→ Easiest way: login as admin → create a new admin with a strong password → then delete the old admin entry from data/users.json (or ask a developer to do it).



Quick checklist for adding a brand-new building





Add a new sheet in the Excel with the building data.



Run the parser script → all_spaces.json updates.



Put one image per floor into public/, using the correct names:





abXX_ground_floor.png



abXX_first_floor.png



abXX_second_floor.png



etc.



Refresh the website → the new building tab appears.



Login as admin → arrange the room boxes on each floor → click Save Layout.

Done!

7. Google Sheets setup and adding data

The Google Sheet is a read-only data source for the app. It does not write changes
back to the Sheet. The app displays a placeholder until you configure its link.

1. Open the source Google Sheet and choose Extensions → Apps Script.
2. Replace the editor contents with the full script in
   frontend/apps-script/Code.gs, then save.
3. Choose Deploy → New deployment → Web app. Set Execute as to your account and
   access to Anyone so the app server can read the JSON. The script only implements
   a read-only doGet; do not put private data in a publicly readable spreadsheet.
4. Deploy and copy the Web app URL ending in /exec.
5. In room_module/frontend/.env.local, set:

   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   NEXT_PUBLIC_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit

6. Restart the Next.js server. Admins can use Sync Spreadsheet to refresh app data
   from the Sheet. When GOOGLE_APPS_SCRIPT_URL is unset, local Excel sync remains
   active. Set the environment variables on the production host as well; .env.local
   is for local development only.

Google Sheet tab layout:

- Each standard building tab must have a header row with at least these first five
  columns in order: Building, Room, Type, Allocation, Intended allocation.
- Put floor labels in column A on their own row, with the remaining cells empty
  (for example Ground Floor, First Floor). Room records follow beneath that
  floor label. Every room needs a value in the Room column.
- Add extra columns after the five standard columns and give each one a unique
  header. Their values appear as extra columns in Data Table and as fields in room
  details.
- Add a new building by adding a tab with this same layout. Its tab name becomes
  the building tab in the app. Add a new floor by adding its floor-label row and
  room records; the floor selector is generated from the data.
- Add a room by adding a row beneath its floor label. Sync the data; no app code
  change is needed.
- Existing AB7, AB8, and AB9 tabs use legacy special parsing. Keep their current
  layouts unless changing the Apps Script and local Excel parser together.
- A new building/floor data tab does not generate a floor-plan image or saved map
  layout. Add the correctly named image under frontend/public/, then arrange and
  save the room boxes as an admin. A new Next.js route/page is a code change and is
  not created by adding a spreadsheet tab.

If sheet sync fails, check that the web app deployment is active, the /exec URL is
correct, the Sheet is readable by the deployment, and the server was restarted
after GOOGLE_APPS_SCRIPT_URL was set.