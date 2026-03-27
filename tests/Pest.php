<?php

use Tests\TestCase;

uses(TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class)->in('Feature');
uses(TestCase::class)->in('Unit');
