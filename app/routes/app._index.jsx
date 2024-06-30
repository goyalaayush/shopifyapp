import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import './styles.css'
import { Card, Page, TextField, Button, Layout, Select, Checkbox,Popover,FormLayout  } from '@shopify/polaris';
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const variantId =
    responseJson.data.productCreate.product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
      mutation shopifyRemixTemplateUpdateVariant($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
            barcode
            createdAt
          }
        }
      }`,
    {
      variables: {
        input: {
          id: variantId,
          price: Math.random() * 100,
        },
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return json({
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantUpdate.productVariant,
  });
};

export default function Index() {

  let sizes = ['Extra - Small 21x30cm', 'Small 30x40cm', 'Medium 50x40cm', 'Medium 60x40cm', 'Large 50x70cm', 'A2', 'A3', 'A4'];
  let variants = ['Poster', 'Canvas', 'Framed', 'Black Framed', 'White Framed', 'Wooden Framed', 'Digital File', 'Hanging Frame'];
  const nav = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";
  const productId = actionData?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  const [apiKey, setApiKey] = useState('');
  const [size, setSize] = useState(['']);
  const [vairant, setVariant] = useState(['']);
  const [show, setShow] = useState(false);

  const togglePopoverActive = () => setPopoverActive(!popoverActive);

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => submit({}, { replace: true, method: "POST" });

  const alert=()=>{
    console.log('AAAA')
  }

  const handleChange = (e) => {

    e.preventDefault();
    const { name, value, checked } = e;

    if (name == 'size') {
      if (checked) {
        setSize([...size, value]);
      }
      else {
        setSize(size.filter((item) => item !== value));
      }
    }

    else {
      if (checked)
        setVariant([...vairant, value]);
      else {
        setVariant(vairant.filter((item) => item !== value))
      }
    }
  }

  return (
    <Page title="Customize Your Star Map">

      <Layout>

        <Layout.Section>
          <div class="grid grid-cols-2 ">
            <div>
              <h5 class="mt-3 font-bold text-xl">Step 1: Add a Google Places API Key</h5>
              <p class="sub-heading mt-1 text-base">
                Used to provide location suggestions.
              </p>
            </div>

            <div>
              <Card title="Add Google API Key" sectioned>
                <h2 className="font-bold mb-3 text-base">IMPORTANT!!! SET YOUR GOOGLE MAPS API KEY HERE:</h2>
                <TextField onChange={(e) => setApiKey(e.target.value)} label="Google Places API Key:" placeholder="Enter your API Key" />
                <button className="w-full bg-[#212529] text-white font-normal h-9 mt-1">Save Google API</button>
                <p>Refer to our <a href="#" className="text-[#0D6EFD]">installation guide(opens a new window)</a>to learn how to generate this API Key.</p>
              </Card>
            </div>
          </div>
        </Layout.Section>


        <Layout.Section >

          <div class="grid grid-cols-2 ">
            <div>
              <h5 class="mt-3 font-bold text-xl">Step 2: Select Variants You Want to Sell</h5>
              <p class="sub-heading mt-1 text-base">
                Select sizes and variants you want to sell.
              </p>
              <p className="mt-7"><span className="text-[#6d7175] text-bold">Note:</span> You can update the product like any normal shopify product,<br></br> just avoid to change variant names
              </p>
              <p className="mt-7">*Changning these variants will reset all the details of variants to default, like price, name, quantity etc.</p>
            </div>

            <div>
              <Card title="Add Product Variants" sectioned>

                <div class="grid grid-cols-2 ">
                  <div>
                    <h2 className="font-bold mb-3 text-base">Sizes you want to sell</h2>
                    <br></br>
                    <p className="mb-1">(Select atleast one)</p>
                    {sizes.map((size) => (
                      (<label class=" mb-1 flex items-center cursor-pointer">
                        <input name='size' type="checkbox" value="" class="sr-only peer" unchecked onChange={() => handleChange('size')} />
                        <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{size}</span>
                      </label>)
                    ))
                    }
                  </div>
                  <div>
                    <h2 className="font-bold mb-3 text-base">Select variants you want to sell.</h2>

                    <p className="mb-1">(Select atleast one)</p>
                    {variants.map((variant) => (
                      (<label class=" mb-1 flex items-center cursor-pointer">
                        <input name="variant" onChange={(e) => handleChange(e)} type="checkbox" value="" class="sr-only peer" unchecked />
                        <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{variant}</span>
                      </label>)
                    ))
                    }
                  </div>
                </div>
                <button className="w-full bg-[#212529] text-white font-normal h-9">Save/Reset Product</button>

              </Card>
            </div>
          </div>

        </Layout.Section>



        <Layout.Section >
          
     <button onClick={alert}>Alert Button</button>
          
          {/* <button id="dropdownDefaultButton" data-dropdown-toggle="dropdown" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">Dropdown button <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4" />
          </svg>
          </button>
          <div id="dropdown" class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
            <ul class="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
              <li>
                <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Dashboard</a>
              </li>
              <li>
                <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Settings</a>
              </li>
              <li>
                <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Earnings</a>
              </li>
              <li>
                <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Sign out</a>
              </li>
            </ul>
          </div> */}

        </Layout.Section>


        <Layout.Section>
          <Card title="Select Variants You Want to Sell" sectioned>
            <Select
              label="Sizes you want to sell"
              options={['Extra-Small 21x30cm', 'Small 30x40cm', 'Medium 50x40cm']}
              placeholder="Select at least one"
              multiple
            />
            <Select
              label="Select variants you want to sell"
              options={['Poster', 'Canvas', 'Framed']}
              placeholder="Select at least one"
              multiple
            />
            <Button>Save/Reset Product</Button>
          </Card>
        </Layout.Section>


        <Layout.Section>
          <Card title="Translations" sectioned>
            <TextField label="Page Language" placeholder="Enter language" />
          </Card>
          <Card title="Images and Icons" sectioned>
            <TextField label="Icon URL" placeholder="Enter icon URL" />
          </Card>
          <Card title="Background Images" sectioned>
            <TextField label="Background Image URL" placeholder="Enter image URL" />
          </Card>
          <Card title="Select Fonts" sectioned>
            <TextField label="Font URL" placeholder="Enter font URL" />
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Reinstall Code (Optional)" sectioned>
            <Checkbox label="Reinstall code if needed" />
            <Button>Re-install Code</Button>
          </Card>
        </Layout.Section>
      </Layout>


    </Page>
  );
}
